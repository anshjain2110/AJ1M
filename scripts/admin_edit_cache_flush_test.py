import json, time, urllib.request

API = "https://seo-waves-cutover.preview.emergentagent.com"
PROJECT_ID = "7e3af7a4-d266-4006-bb1a-0151675105f8"  # 3-carat-radiant-solitaire-engagement-ring
SLUG = "3-carat-radiant-solitaire-engagement-ring"
TEST_TITLE = "CACHE-FLUSH TEST — 3 Carat Radiant Solitaire | The Local Jewel"


def req(method, path, data=None, token=None):
    url = API + path
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(url, data=body, method=method)
    r.add_header("Content-Type", "application/json")
    r.add_header("User-Agent", "Mozilla/5.0 (cache-flush-test)")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(r, timeout=30) as resp:
        return resp.status, resp.read().decode()


def ssr_title():
    r = urllib.request.Request(API + "/projects/" + SLUG)
    r.add_header("User-Agent", "Mozilla/5.0 (cache-flush-test)")
    with urllib.request.urlopen(r, timeout=30) as resp:
        html = resp.read().decode(errors="ignore")
    import re
    m = re.search(r"<title>(.*?)</title>", html)
    return m.group(1) if m else "(no title)"


# 1) admin login
st, tok_json = req("POST", "/api/admin/auth/login", {"email": "ansh@thelocaljewel.com", "password": "Rakesh@2709"})
token = json.loads(tok_json)["token"]
print("1) admin login:", st, "token_len=", len(token))

# 2) current SSR title + fetch full project doc
before = ssr_title()
print("2) SSR <title> BEFORE:", before)
st, doc_json = req("GET", "/api/admin/projects/" + PROJECT_ID, token=token)
doc = json.loads(doc_json)
orig_meta = doc.get("meta_title", "")
print("   original meta_title:", repr(orig_meta))

# 3) edit meta_title (this admin PUT triggers _seo_refresh -> Next revalidate)
payload = dict(doc)
payload["meta_title"] = TEST_TITLE
st, _ = req("PUT", "/api/admin/projects/" + PROJECT_ID, payload, token=token)
print("3) admin PUT (edit meta_title):", st)

# 4) re-fetch SSR WITHOUT manual revalidate — should reflect the edit (cache flushed by the admin action)
time.sleep(3)
after = ssr_title()
print("4) SSR <title> AFTER edit :", after)
print("   >>> CACHE FLUSHED BY ADMIN EDIT:", TEST_TITLE.split(" | ")[0] in after)

# 5) revert
payload["meta_title"] = orig_meta
st, _ = req("PUT", "/api/admin/projects/" + PROJECT_ID, payload, token=token)
print("5) admin PUT (revert meta_title):", st)
time.sleep(3)
reverted = ssr_title()
print("   SSR <title> AFTER revert:", reverted)
print("   >>> REVERTED OK:", "CACHE-FLUSH TEST" not in reverted)
