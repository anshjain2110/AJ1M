#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Complete the Next.js 15 App Router SSR migration for SEO + AI-crawler visibility WITHOUT touching the
  live CRA at /app/frontend. Build side-by-side in /app/frontend-next, preserve exact slugs
  (/projects/[slug], /collections/[slug]), unique per-page metadata + single www canonical, dedupe
  Org/WebSite JSON-LD, NO AggregateRating (Etsy reviews are third-party), full Product/Offer/ProductGroup/
  Breadcrumb structured data, real 404s, sitemap.xml + robots.txt, ISR revalidation wired to FastAPI
  _seo_refresh(). Cut over in waves; Wave 1 = homepage + /collections + /collections/[slug] + PDP.

backend:
  - task: "ISR revalidation hook (_seo_refresh -> _ping_nextjs_revalidate -> Next /api/revalidate)"
    implemented: true
    working: true
    file: "/app/backend/admin_routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Existing backend hook (unchanged code). Set NEXT_REVALIDATE_URL=http://localhost:3001/api/revalidate + NEXT_REVALIDATE_TOKEN in backend/.env and restarted backend. Verified end-to-end: backend _ping_nextjs_revalidate POSTs {paths} with x-revalidate-token; Next /api/revalidate returns 200 and flushes ISR cache (stale collection title -> revalidate -> fresh)."

frontend:
  - task: "Next.js 15 SSR app scaffolded side-by-side in /app/frontend-next (Wave 1)"
    implemented: true
    working: true
    file: "/app/frontend-next"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Production `yarn build` clean. Live CRA at /app/frontend UNTOUCHED. Ported real components as client comps (SSR'd); react-router-dom + react-helmet-async aliased to compat shims; analytics/CartContext SSR-guarded + global ls/ss stub."
  - task: "Homepage SSR (real homepage: hero, quote wizard, engagement, featured, Etsy social proof) + Org/WebSite JSON-LD once + www canonical"
    implemented: true
    working: true
    file: "/app/frontend-next/app/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "View-Source has full real content (H1, all marketing sections, real <a href> nav). Exactly ONE Organization + ONE WebSite JSON-LD; ZERO AggregateRating. Unique title + meta description + single canonical https://www.thelocaljewel.com. NOTE: benign hydration warning from framer-motion entrance anim / time-based delivery date (SSR HTML is correct for crawlers) - polish item."
  - task: "/collections + /collections/[slug] SSR + BreadcrumbList + 404"
    implemented: true
    working: true
    file: "/app/frontend-next/app/collections"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Both SSR real content + real product <a href> links + BreadcrumbList + unique title/desc + www self-canonical. Missing collection slug returns real HTTP 404. collection/[slug] is dynamic SSR (always fresh)."
  - task: "PDP /projects/[slug] SSR + Product/Offer/ProductGroup/Breadcrumb + 404 + NO AggregateRating"
    implemented: true
    working: true
    file: "/app/frontend-next/app/projects/[slug]/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Visible price seeded server-side ($1,800) matches Product Offer JSON-LD. 3 valid ld+json blocks: Product (price/cur/availability/itemCondition + OfferShippingDetails + MerchantReturnPolicy + IGI Certification), ProductGroup (productGroupID + variesBy material/size + 40 hasVariant w/ offers), BreadcrumbList(4). ZERO aggregateRating/review schema. /projects/does-not-exist returns real 404. Variant selectors + add-to-cart interactive."
  - task: "sitemap.xml + robots.txt (www, products+collections, exclude admin/login/dashboard)"
    implemented: true
    working: true
    file: "/app/frontend-next/app/sitemap.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Removed conflicting static public/robots.txt + public/sitemap.xml. Dynamic sitemap lists products + collections + static routes (all www host), excludes admin/login/dashboard. robots.txt disallows /admin /login /dashboard /cart /checkout and references sitemap."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Wave 1 verified via curl + screenshots; awaiting user approval before cutover"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Wave 1 of the Next.js SSR migration is built side-by-side in /app/frontend-next and verified manually (View-Source content, unique metadata + single www canonical, single Org/WebSite, zero AggregateRating, valid Product/ProductGroup/Breadcrumb JSON-LD, real 404s, sitemap/robots, ISR revalidation loop). Live CRA at /app/frontend is UNTOUCHED. NOT cut over yet - awaiting user approval per the wave plan. The Next app runs on localhost:3001 (not the external preview URL, which still serves the live CRA on :3000)."
