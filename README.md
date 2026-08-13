# Haulr: Moving Made Easy

Build Haulr — On-Demand Moving & Large Item Delivery Marketplace



Build a polished, modern MVP called Haulr.



Haulr connects people who need furniture, appliances, Marketplace purchases, small moves, and other large items transported with local movers who have pickup trucks, vans, and box trucks.



The product should feel like Uber for moving and large-item delivery.



The MVP should be realistic enough to demo to customers, movers, and investors.



⸻



1. BRAND



Name: Haulr



Tagline:



Big stuff. Moved easy.



Use a premium logistics/startup aesthetic.



Design should be:

	•	Modern

	•	Clean

	•	Mobile-first

	•	Fast

	•	Trustworthy

	•	Simple

	•	Professional



Use large CTA buttons, rounded cards, subtle shadows, clear typography, and excellent spacing.



Do not make it look like a traditional moving-company website.



⸻



2. LANDING PAGE



Create a beautiful homepage.



Hero:



Big stuff. Moved easy.



Subheadline:



Book a trusted local mover to pick up, load, transport, and deliver your furniture and large items.



Primary button:



Get a Quote



Secondary button:



Become a Mover



Hero booking widget:



PICKUP



Enter pickup address.



DROP-OFF



Enter destination.



WHAT ARE YOU MOVING?



Dropdown:

	•	Couch

	•	Sectional

	•	Bed

	•	Mattress

	•	Dresser

	•	Table

	•	Chair

	•	TV

	•	Appliance

	•	Boxes

	•	Multiple items

	•	Other



WHEN?

	•	ASAP

	•	Schedule for later



Button:



Get My Estimate



⸻



3. SERVICES



Create a section showing:



Furniture Delivery



Get furniture picked up and delivered.



Marketplace Pickup



Buy something online? Haulr picks it up and brings it to you.



Small Moves



Apartments, dorms, rooms, and small offices.



Appliance Delivery



Move refrigerators, washers, dryers, and other large appliances.



Labor Only



Need help loading or unloading? Hire movers without a truck.



Junk Removal



Request pickup and hauling of unwanted large items.



⸻



4. HOW IT WORKS



Show four steps.



1. Tell us what you’re moving



Enter locations and upload photos.



2. Get an upfront estimate



See your estimated price before requesting the job.



3. Get matched with a mover



A qualified local mover accepts your job.



4. Track your delivery



Follow the job from pickup to drop-off.



⸻



5. CUSTOMER AUTHENTICATION



Use Supabase Authentication.



Create:

	•	Sign up

	•	Login

	•	Logout

	•	Forgot password

	•	Profile



Users can select:



Customer



or



Mover



Store the role in the database.



⸻



6. CUSTOMER BOOKING FLOW



Create a polished multi-step booking experience.



Step 1 — Locations



Pickup address.



Drop-off address.



Show estimated distance.



Step 2 — Items



Allow multiple items.



Each item should have:

	•	Item type

	•	Quantity

	•	Approximate size

	•	Optional weight

	•	Photo upload



Allow multiple photos.



Display:



Photos help us provide a more accurate estimate.



Step 3 — Access



Pickup:

	•	Ground floor

	•	Stairs

	•	Elevator

	•	Loading dock



Drop-off:

	•	Ground floor

	•	Stairs

	•	Elevator

	•	Loading dock



Ask number of flights of stairs.



Ask:



Is parking available?



Step 4 — Service



Options:

	•	Full Service

	•	Labor Only

	•	Curbside

	•	Room of Choice



Optional add-ons:

	•	Extra mover

	•	Disassembly

	•	Assembly

	•	Additional stop

	•	Heavy item

	•	Stairs



Step 5 — Vehicle



Recommend a vehicle based on the items.



Options:



Pickup Truck



Small loads.



Cargo Van



Medium loads.



Box Truck



Large loads.



Step 6 — Estimate



Show:



Base price



Distance



Labor



Vehicle



Additional services



Platform fee



Estimated total



Example:



Estimated total: $149



Include:



This is an estimate. The final price may change if the actual job differs significantly from the information provided.



⸻



7. PRICING ENGINE



Do NOT hard-code pricing into UI components.



Create a reusable pricing service.



Initial demo pricing:



Base fee: $45



Mileage: $2.25/mile



Mover labor: $35/hour



Extra mover: $30/hour



Stairs: $15/flight



Additional stop: $25



Heavy item: $25



Waiting time: $1/minute after the included waiting period



These are ONLY starting demo values.



Create an admin pricing screen so these values can later be changed without editing code.



⸻



8. CUSTOMER DASHBOARD



Create a customer dashboard.



Show:



Active Job



Status



Mover



Vehicle



ETA



Pickup



Drop-off



Tracking placeholder



Upcoming Jobs



Past Jobs



Account



Profile



Payment methods



Saved addresses



Support



⸻



9. MOVER DASHBOARD



Create a separate mover interface optimized for mobile.



Top:



ONLINE / OFFLINE



When online, show available jobs.



Dashboard:



Today’s earnings



Weekly earnings



Completed jobs



Rating



Current job



Available jobs



⸻



10. MOVER REGISTRATION



Mover creates an account.



Collect:



Name



Phone



Email



Address



Driver’s license information



Vehicle type



Vehicle year



Vehicle make



Vehicle model



Vehicle photos



Insurance information



Profile photo



Service area



Create onboarding status:



Pending



Under Review



Approved



Rejected



Only approved movers can receive jobs.



⸻



11. MOVER JOB CARD



When a job becomes available, show:



NEW JOB



Pickup location



Drop-off location



Distance



Items



Vehicle required



Estimated duration



Customer price



Mover payout



Example:



Customer price:



$149



Estimated mover payout:



$112



Buttons:



ACCEPT JOB



DECLINE



⸻



12. JOB STATUS



Use these statuses:



REQUESTED



SEARCHING



MOVER_ASSIGNED



MOVER_EN_ROUTE



MOVER_ARRIVED



LOADING



IN_TRANSIT



ARRIVED



UNLOADING



COMPLETED



CANCELLED



DISPUTED



Display status visually with a progress tracker.



⸻



13. MOVER JOB SCREEN



Show:



Customer



Pickup address



Drop-off address



Items



Special instructions



Estimated payout



Navigation button



Contact customer



Status controls



Require mover to upload pickup photos.



Require delivery photos before completing the job.



Buttons:



I’m on my way



I’ve arrived



Start loading



Loading complete



Start delivery



Arrived



Complete job



⸻



14. CUSTOMER TRACKING



Create a live tracking-style interface.



Show:



Map placeholder



Mover profile photo



Mover name



Vehicle



Rating



ETA



Current job status



Use a clean map component that can later be connected to Google Maps or Mapbox.



Create the architecture so a real GPS tracking service can be added later.



⸻



15. PAYMENTS



Prepare the application for Stripe.



Use Stripe test mode.



Customer pays for the booking.



Store:



Payment ID



Customer



Job



Amount



Platform fee



Mover payout



Payment status



Create the architecture for Stripe Connect so movers can eventually receive payouts through their own connected accounts.



IMPORTANT:



Never expose Stripe secret keys in frontend code.



Use environment variables.



Use server-side functions for secret Stripe operations.



Create:



.env.example



with placeholders for Stripe and Supabase credentials.



Never commit real credentials.



⸻



16. MOVER PAYOUT



Example:



Customer pays:



$149



Platform fee:



$30



Mover payout:



$119



Display this clearly in the mover dashboard.



Do not actually transfer real money unless Stripe is configured.



Create a clean Stripe Connect integration point for future payouts.



⸻



17. RATINGS



After a completed job, customer sees:



How was your move?



1–5 stars.



Optional written review.



Mover profile displays:



Average rating



Number of completed jobs



⸻



18. ADMIN DASHBOARD



Create a powerful admin dashboard.



Show:



Total customers



Total movers



Active movers



Jobs today



Jobs this week



Completed jobs



Cancelled jobs



Gross booking value



Platform revenue



Mover payouts



Average rating



Create charts.



⸻



19. ADMIN JOB MANAGEMENT



Table columns:



Job ID



Customer



Mover



Pickup



Drop-off



Date



Status



Customer price



Mover payout



Platform fee



Actions



Admin can:



View



Cancel



Reassign mover



Refund



Adjust price



Contact customer



Contact mover



⸻



20. ADMIN MOVER MANAGEMENT



Show:



Mover name



Rating



Vehicle



Approval status



Jobs completed



Earnings



Application date



Admin can:



Approve



Reject



Suspend



View profile



View documents



View vehicle



View job history



⸻



21. ADMIN PRICING



Create settings for:



Base fee



Mileage rate



Labor rate



Extra mover fee



Vehicle fee



Stair fee



Heavy item fee



Additional stop fee



Waiting fee



Platform commission



Store pricing in Supabase.



⸻



22. DATABASE



Use Supabase/PostgreSQL.



Create tables:



users



customer_profiles



mover_profiles



vehicles



mover_documents



jobs



job_items



job_photos



job_status_history



job_assignments



payments



payouts



ratings



reviews



addresses



pricing_rules



notifications



support_tickets



admin_actions



⸻



23. SECURITY



Implement Supabase Row Level Security.



Customers can only access their own data.



Movers can only access their own profile, jobs, earnings, and documents.



Admins can access platform data.



Do not expose private information.



Do not put service-role keys in frontend code.



⸻



24. DEMO DATA



Populate the application with realistic demo data.



Create:



10 customers



8 movers



8 vehicles



20 jobs



Realistic addresses



Realistic prices



Ratings



Job statuses



Earnings



This should make the application look alive immediately.



⸻



25. MOBILE DESIGN



The customer booking flow should be excellent on mobile.



The mover dashboard should feel like a mobile application.



Use:



Bottom navigation for mobile where appropriate.



Large touch targets.



Sticky action buttons.



Clear status indicators.



Avoid complicated menus.



⸻



26. NAVIGATION



Customer:



Home



Book



Active Job



History



Account



Mover:



Home



Available Jobs



Current Job



Earnings



Profile



Admin:



Dashboard



Jobs



Movers



Customers



Payments



Pricing



Support



Settings



⸻



27. CODE ARCHITECTURE



Keep the code clean and modular.



Separate:



components



pages



hooks



services



database



authentication



pricing



payments



types



utilities



Do not create giant React components.



Use TypeScript.



Create reusable components.



Use proper loading states.



Use proper empty states.



Use proper error states.



⸻



28. IMPORTANT



This is an MVP.



Do not waste time building unnecessary features.



The most important working flow is:



CUSTOMER



Landing page



→ Get Quote



→ Enter locations



→ Add items



→ Upload photos



→ Get estimate



→ Request job



→ Payment



→ Mover assigned



→ Track job



→ Complete



→ Rate mover



MOVER



Register



→ Apply



→ Admin approval



→ Go online



→ Receive job



→ Accept



→ Navigate



→ Complete job



→ Earnings



ADMIN



Login



→ Dashboard



→ Approve movers



→ Manage jobs



→ Manage pricing



→ Manage payments



⸻



FINAL REQUIREMENT



Build this as a real startup MVP, not a static mockup.



Buttons should work.



Forms should work.



Authentication should work.



Database should work.



Pricing calculation should work.



Job creation should work.



Job status changes should work.



Use mock integrations where external credentials are unavailable, but structure the code so Stripe, maps, SMS, GPS tracking, and identity verification can be connected later.



Make the UI polished enough that I can show the product to potential customers and movers.



Before finishing, check the entire application for broken links, broken buttons, console errors, mobile responsiveness issues, and obvious UX problems.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/651a3477-dbf7-44ce-ac0e-c3c615aea09e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
