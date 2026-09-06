# Farmztrade Connect

Build a production-quality, mobile-first marketplace application called:

FARMZTRADE

Tagline:

"Better Care. Better Growth. Better Tomorrow."

IMPORTANT BRANDING:

- The application name must ALWAYS be "FARMZTRADE".

- Do NOT use "FarmTrade".

- Do NOT use "BTS Farms" as the application name.

- Use the uploaded BTS FARMS logo/image as visual inspiration for the brand identity.

- Create a modern green + white agricultural/livestock visual identity inspired by the uploaded references.

- Primary brand color: deep natural farm green.

- Secondary colors: lighter green, warm earthy/gold accents, white and very light neutral backgrounds.

- The application should feel premium, trustworthy, modern, rural-friendly and highly polished.

- The design should NOT look like a generic admin dashboard or generic e-commerce template.

TECH STACK:

- React + TypeScript

- Vite

- Tailwind CSS

- shadcn/ui where useful

- Framer Motion for animations and micro-interactions

- Supabase for backend/database/auth/storage/realtime

- Capacitor-compatible architecture because this web application will later be converted into an Android application.

- Make the UI responsive for mobile, tablet and desktop, but prioritize mobile.

- Do not use browser-only functionality that will create problems when wrapped with Capacitor.

- Use clean component architecture and reusable components.

- Use proper loading states, skeletons, empty states, error states and success states.

AUTHENTICATION:

Use OTP-based authentication.

Do NOT use password-based login as the primary authentication.

Authentication flow:

1. User opens FARMZTRADE.

2. Splash screen with FARMZTRADE logo and attractive animation.

3. User enters mobile number.

4. Send OTP.

5. User enters OTP.

6. Verify OTP.

7. If the user account is not yet approved by admin:

   - Show "Account Under Verification".

   - Explain that the account must be verified by FARMZTRADE admin before marketplace access.

8. If approved:

   - User can enter the application.

9. New users should complete their profile after OTP verification.

10. Existing approved users should go directly to the Home screen.

Include:

- Resend OTP countdown

- Change mobile number

- OTP validation

- Invalid OTP state

- Network error state

- Logout

- Session persistence

- Secure authentication

USER TYPES / ROLES:

1. CUSTOMER / USER

2. ADMIN

A normal user can BOTH:

- Buy animals

- Sell animals

- Buy pet/livestock food

- Chat with sellers

- Make offers

- Manage listings

- Manage favorites

- Manage purchases

- Manage profile

ADMIN:

- Verify users

- Approve/reject user accounts

- Manage users

- Manage animal listings

- Approve/reject listings

- Manage pet food products

- Manage orders

- Manage reported users/listings

- Manage offers if necessary

- View basic marketplace statistics

IMPORTANT:

A seller must be verified by admin before they can create an animal listing.

==================================================

BOTTOM NAVIGATION

==================================================

For mobile, use a premium 5-tab bottom navigation:

1. Home

2. Search

3. Feed

4. Sell

5. Profile

The "Feed" tab is the pet/livestock food store.

Use a floating/central action treatment for Sell if visually appropriate, but maintain the 5-tab structure.

Chat should be accessible from:

- Animal details

- Profile

- Home header/inbox

- Bottom navigation or a floating chat entry depending on screen.

==================================================

1. SPLASH SCREEN

==================================================

Create a beautiful animated splash screen.

Display:

- FARMZTRADE logo

- "Better Care. Better Growth. Better Tomorrow."

- subtle farm/nature background

- premium green gradient

- animated logo entrance

- gentle livestock/nature motion

- loading transition

Use Framer Motion:

- fade

- scale

- spring animation

- staggered logo/text entrance

Do not make it overly flashy. It should feel premium.

==================================================

2. ONBOARDING

==================================================

Create 3 onboarding screens:

Screen 1:

"Buy & Sell Livestock Easily"

Find genuine animals from verified sellers.

Screen 2:

"Connect Directly"

Chat with sellers, make offers and arrange a meeting.

Screen 3:

"Everything Your Animals Need"

Buy quality livestock/pet food from the FARMZTRADE Feed store.

Buttons:

- Skip

- Next

- Get Started

Use attractive livestock imagery and Framer Motion page transitions.

==================================================

3. LOGIN / OTP

==================================================

Screen:

"Welcome to FARMZTRADE"

Subtitle:

"Buy. Sell. Grow."

Mobile number field:

+91 | Mobile Number

Button:

"Get OTP"

OTP screen:

"Verify your number"

4/6 digit OTP input.

Buttons:

- Verify OTP

- Resend OTP

- Change Number

After verification:

If pending:

"Your account is being verified"

"FARMZTRADE verifies every seller to help keep our marketplace trustworthy."

If approved:

Go to Home.

==================================================

4. PROFILE REGISTRATION

==================================================

For first-time users collect:

- Full Name

- Profile Photo

- Mobile Number

- Location

- District

- State

- Village/Town

- Pincode

- Optional alternate contact

- User type / intent:

  - Buyer

  - Seller

  - Both

Seller verification information:

- Government ID upload

- Address proof if required

- Farm/business details

- Optional farm photos

- Livestock experience/details

Show:

"Verification Pending"

Admin will approve or reject the seller.

Do not expose sensitive ID numbers unnecessarily in the UI.

==================================================

5. HOME SCREEN

==================================================

Create a visually impressive home screen inspired by the uploaded reference.

Header:

- FARMZTRADE logo

- Location

- Notification icon

- Profile/avatar

Search bar:

"Search animals, breeds, locations..."

Hero section:

"Find the right animal for your farm"

"Trusted sellers. Better choices."

Buttons:

- Buy Animals

- Sell an Animal

- Shop Feed

Categories section:

Only use these animal categories:

1. Dogs

2. Cats

3. Chicken

4. Buffalo

5. Cow

6. Goat

7. Sheep

8. Horses

Do NOT create dozens of unnecessary categories.

Each category should have:

- beautiful animal image/icon

- category name

- count

Featured Animals:

Horizontal cards with:

- animal image

- category

- breed

- age

- gender

- price

- location

- verified seller badge

- favorite heart

Example:

Murrah Buffalo

Female • 3 Years

₹85,000

Guntur, Andhra Pradesh

✓ Verified Seller

Also include:

"Recently Added"

"Popular Near You"

"Verified Sellers"

==================================================

6. ANIMAL LISTING

==================================================

Animal cards should look premium and image-focused.

Card information:

- Multiple images

- Animal category

- Breed

- Gender

- Age

- Weight

- Price

- Location

- Seller verification badge

- Listing status

- Favorite button

Use large rounded images.

Add subtle Framer Motion:

- card hover scale

- image transition

- favorite heart animation

- staggered list entrance

==================================================

7. SEARCH & FILTER

==================================================

Search animals by:

- keyword

- breed

- location

Filters:

Category:

- Dogs

- Cats

- Chicken

- Buffalo

- Cow

- Goat

- Sheep

- Horses

Breed

Location:

- State

- District

- City/Town

Price:

- Minimum

- Maximum

Age:

- Minimum

- Maximum

Gender:

- Male

- Female

- Any

Weight:

- Minimum

- Maximum

Verified sellers only:

Toggle

Vaccination:

- Vaccinated

- Not specified

Sort:

- Newest

- Price Low to High

- Price High to Low

- Nearest

- Popular

Create a beautiful mobile filter bottom sheet.

==================================================

8. ANIMAL DETAILS

==================================================

This should be one of the most polished screens.

Top:

- Full-screen image/video carousel

- Back

- Favorite

- Share

Display:

- Animal name

- Price

- Location

- Verified Seller badge

- Popular badge if applicable

Details:

Breed

Gender

Age

Weight

Health

Vaccination

Pregnancy where applicable

Description

Example:

Murrah Buffalo

₹85,000

Guntur, Andhra Pradesh

Breed: Murrah

Gender: Female

Age: 3 Years

Weight: 480 kg

Milk: 10 L/day

Pregnancy: Not Pregnant

Vaccination: Yes

Seller section:

- Profile photo

- Seller name

- Verified Seller

- Member since

- Location

- Seller rating/reputation

Buttons:

- Make Offer

- Chat with Seller

- Add to Cart / Interested

IMPORTANT MARKETPLACE BEHAVIOR:

Animals are unique physical items, so "Add to Cart" should behave more like:

"Add to Interested / Cart"

A user can add animals to their cart/interested list.

If the user is NOT logged in and tries to:

- Add to Cart

- Chat

- Make Offer

- Contact Seller

- Buy

then show the OTP login/signup flow.

Do NOT force login just to browse animals.

==================================================

9. MAKE OFFER

==================================================

Create a polished offer modal/page.

Show:

Animal

Seller

Listed Price

Input:

"Your Offer Price"

Optional:

Message to Seller

Button:

"Send Offer"

Offer statuses:

- Pending

- Accepted

- Rejected

- Counter Offer

- Expired

- Withdrawn

Seller can:

- Accept

- Reject

- Counter Offer

Buyer receives notification.

==================================================

10. CHAT

==================================================

Create real-time buyer/seller chat using Supabase Realtime.

Conversation is always associated with a specific listing.

Chat header:

Seller name

Online/Last seen

Animal being discussed

Show listing mini-card at top:

Animal image

Name

Price

Messages:

- Buyer messages

- Seller messages

- timestamps

- read status

Quick actions:

"Is this available?"

"Can I visit?"

"Can you negotiate?"

"What is the location?"

Allow:

- text

- image attachment

- offer card

Offer messages should appear as special cards inside chat.

Example:

Offer Received

₹75,000

[Accept] [Reject] [Counter]

Do not build unsafe payment/transaction claims inside chat.

==================================================

11. MEETING / VISIT

==================================================

After seller and buyer agree to meet, allow them to coordinate.

Add:

"Arrange Visit"

Fields:

- Date

- Approximate time

- Meeting location

- Message

Show meeting details in chat.

Use location/map functionality in a Capacitor-compatible way.

Do not claim that FARMZTRADE guarantees the transaction.

==================================================

12. SELL AN ANIMAL

==================================================

Create a very polished multi-step listing creation flow.

Step 1:

Select Category

Only:

Dogs

Cats

Chicken

Buffalo

Cow

Goat

Sheep

Horses

Step 2:

Animal Details

- Breed

- Gender

- Age

- Weight

- Health condition

- Vaccination

- Pregnancy where applicable

- Price

- Negotiable Yes/No

- Description

Step 3:

Photos

Require:

Minimum 3 photos if possible.

Allow:

- Camera

- Gallery

- Multiple photos

- Reorder photos

- Delete photos

Step 4:

Video optional.

Step 5:

Location

- State

- District

- City/Town

- Village

- Pincode

- Optional map location

Step 6:

Preview Listing

Step 7:

Submit

After submission:

"Listing submitted for admin approval."

Listing statuses:

- Draft

- Pending Approval

- Approved

- Rejected

- Sold

- Suspended

Only approved listings appear publicly.

==================================================

13. MY LISTINGS

==================================================

Tabs:

Pending

Active

Sold

Rejected

Each listing shows:

- Image

- Animal

- Price

- Location

- Views

- Favorites

- Offers

- Status

Actions:

- Edit

- Pause

- Mark as Sold

- Delete

- View Offers

Use analytics-style information but keep it simple.

==================================================

14. FAVORITES

==================================================

Users can favorite animals.

Show:

"My Favorites"

Cards:

- Animal

- Price

- Location

- Seller verification

- Availability

If animal is sold:

show:

"SOLD"

==================================================

15. CART / INTERESTED ANIMALS

==================================================

Create an "Interested" / cart-like screen for animals.

Because livestock is unique inventory, prevent multiple users from treating the same animal like normal e-commerce stock.

Show:

- Animal

- Seller

- Listed price

- Current offer if any

- Availability

Actions:

- Chat

- Make Offer

- Remove

If the animal becomes unavailable:

show an unavailable state.

==================================================

16. FEED TAB — PET/LIVESTOCK FOOD STORE

==================================================

This is an important additional module.

Bottom navigation tab:

"Feed"

This is a real e-commerce section operated by FARMZTRADE admin.

Header:

"FARMZTRADE Feed"

"Quality nutrition for healthier animals."

Categories can include:

- Dog Food

- Cat Food

- Chicken Feed

- Cattle Feed

- Goat Feed

- Sheep Feed

- Horse Feed

Keep the categories focused on the supported animals.

Admin can create products.

Product card:

- Product image

- Product name

- Brand

- Animal type

- Weight/quantity

- Price

- Stock

- Rating

- Add to Cart

Example:

Premium Cattle Feed

25 kg

₹1,250

In Stock

Buttons:

"Add to Cart"

==================================================

17. FEED PRODUCT DETAILS

==================================================

Show:

- Image gallery

- Product name

- Brand

- Description

- Ingredients

- Suitable for

- Weight

- Price

- Stock

- Delivery information

- Quantity selector

Buttons:

- Add to Cart

- Buy Now

This is normal e-commerce inventory.

==================================================

18. FEED CART

==================================================

Separate Feed Cart from Animal Interested Cart.

Feed Cart:

- Product

- Quantity

- Price

- subtotal

- delivery

- total

Button:

"Proceed to Checkout"

==================================================

19. FEED CHECKOUT

==================================================

Collect:

- Name

- Mobile

- Delivery address

- State

- District

- City

- Pincode

Order summary.

Payment integration should be structured so it can use an Indian payment gateway such as Razorpay.

IMPORTANT:

Do not create fake successful payments.

Payment flow must have proper:

- pending

- success

- failed

- cancelled

Order statuses:

- Payment Pending

- Confirmed

- Processing

- Shipped

- Delivered

- Cancelled

==================================================

20. MY PURCHASES / ORDERS

==================================================

Create:

"My Orders"

Show feed purchases.

Each order:

- Order ID

- Date

- Products

- Total

- Payment status

- Order status

- Delivery address

- Track order

==================================================

21. PROFILE

==================================================

Profile screen inspired by the uploaded reference.

Show:

- Profile photo

- Name

- Verified badge if approved

- Mobile

- Location

Menu:

My Listings

Favorites

My Offers

My Purchases

My Feed Orders

Messages

Notifications

Verification

Language

Help & Support

Terms & Privacy

Logout

Allow profile editing.

==================================================

22. NOTIFICATIONS

==================================================

Create notifications for:

- Account approved

- Account rejected

- Listing approved

- Listing rejected

- New message

- New offer

- Offer accepted

- Counter offer

- Animal sold

- Favorite listing updated

- Feed order confirmed

- Feed order shipped

- Feed order delivered

Use notification badges.

==================================================

23. ADMIN PANEL

==================================================

Create a separate secure admin dashboard.

Admin login should be role-protected.

Admin dashboard cards:

- Total Users

- Pending Verifications

- Verified Users

- Pending Listings

- Active Listings

- Sold Animals

- Feed Orders

- Revenue from Feed

- Reports

Admin sections:

USER MANAGEMENT

- All Users

- Pending Verification

- Approved

- Rejected

- Suspended

For each user:

- profile

- phone

- location

- verification documents

- listings

- reports

- status

Actions:

Approve

Reject

Suspend

LISTING MANAGEMENT:

- Pending Listings

- Active Listings

- Sold

- Rejected

- Reported

Admin can inspect:

- photos

- videos

- seller

- animal details

- location

- price

Actions:

Approve

Reject

Suspend

FEED STORE MANAGEMENT:

Products:

- Add

- Edit

- Delete

- Enable/Disable

- Stock

- Price

- Images

- Category

Orders:

- View

- Update status

- Cancel

- Refund status

REPORTS:

Users can report:

- suspicious seller

- fake listing

- inappropriate content

- scam

- duplicate listing

Admin can review reports.

==================================================

24. DATABASE / SUPABASE

==================================================

Design a proper relational Supabase database.

Suggested tables:

profiles

user_verifications

animal_categories

animal_listings

animal_images

animal_videos

favorites

animal_cart

offers

conversations

conversation_participants

messages

meetings

notifications

feed_categories

feed_products

feed_product_images

feed_cart

feed_orders

feed_order_items

payments

reports

admin_actions

Important fields should include:

- UUID primary keys

- created_at

- updated_at

- user_id

- seller_id

- buyer_id

- listing_id

- status

Use proper foreign keys.

Implement Row Level Security.

SECURITY:

- Users can only edit their own profile.

- Sellers can only edit their own listings.

- Users can only access conversations they participate in.

- Users can only see their own orders.

- Admin-only tables/actions must be protected.

- Do not expose service-role keys in frontend.

- Never expose verification documents publicly.

- Store private documents in secure storage.

- Validate uploads.

- Validate prices and quantities server-side.

- Do not trust frontend role values.

==================================================

25. UI / UX DESIGN

==================================================

The UI must look PREMIUM.

Reference the uploaded design images for:

- overall structure

- livestock marketplace concept

- green branding

- mobile card layout

- bottom navigation

- bilingual labels

But improve the design substantially.

Brand:

FARMZTRADE

Use:

- deep agricultural green

- soft green

- white

- warm earthy accent

- subtle gradients

- large rounded cards

- clean typography

- premium spacing

- modern icons

- high-quality animal photography

Avoid:

- excessive shadows

- clutter

- tiny text

- generic Bootstrap appearance

- too many colors

- outdated dashboard styling

==================================================

26. FRAMER MOTION — IMPORTANT

==================================================

Use Framer Motion extensively but tastefully.

I want the application to feel "crazy smooth" and alive.

Implement:

Page transitions:

- fade + slide

- shared layout transitions

Home:

- staggered category cards

- animated hero

- subtle floating elements

Animal cards:

- hover/tap scale

- image reveal

- favorite heart animation

Favorite:

- heart pop animation

Add to cart:

- button morph animation

- item count animation

Offers:

- animated offer card

Chat:

- message entrance animation

- typing indicator

- offer card transitions

Bottom navigation:

- active indicator animation

- smooth icon transitions

Feed:

- product card entrance

- cart animation

- checkout transition

Admin:

- dashboard number count-up

- cards entering with stagger

Modals:

- spring animation

- backdrop blur

- scale/fade

Use AnimatePresence where appropriate.

IMPORTANT:

Animations must remain performant on Android devices.

Do NOT create heavy animations that cause jank.

Respect reduced-motion preferences.

==================================================

27. MOBILE / CAPACITOR REQUIREMENTS

==================================================

This application will eventually be converted to Android using Capacitor.

Therefore:

- Mobile-first design.

- Touch-friendly controls.

- Minimum comfortable tap targets.

- Safe-area support.

- Avoid hover-only interactions.

- Handle Android back navigation appropriately where possible.

- Camera/gallery uploads should be compatible with Capacitor.

- Location should be designed so Capacitor Geolocation can be integrated.

- Notifications should be structured so Capacitor Push Notifications can be integrated later.

- Do not depend on desktop-only browser APIs.

- Avoid fixed elements that conflict with Android safe areas.

- Make scrolling smooth.

- Optimize image sizes and lazy-load images.

- Keep bundle size reasonable.

==================================================

28. LANGUAGE

==================================================

Primary language:

English

Add language selector:

English

తెలుగు

Structure all UI text so Telugu localization can be added properly.

Do not hardcode text in ways that make translation difficult.

==================================================

29. TRUST / SAFETY

==================================================

FARMZTRADE is a marketplace connecting buyers and sellers.

Clearly communicate:

"FARMZTRADE connects buyers and sellers. We do not take responsibility for transactions between parties."

Show:

✓ Verified Seller

✓ Admin Approved

✓ Secure Chat

But do NOT claim:

- guaranteed animals

- guaranteed health

- guaranteed transaction

- guaranteed seller authenticity beyond the verification process

Provide:

Report Listing

Report Seller

Block User

==================================================

30. EMPTY / LOADING / ERROR STATES

==================================================

Every major page needs polished states.

Examples:

No animals:

"No animals found"

"Try changing your filters."

No favorites:

"Your favorites will appear here."

No messages:

"Start a conversation with a seller."

No orders:

"You haven't placed any feed orders yet."

Loading:

Use skeleton cards rather than blank screens.

Network failure:

"Something went wrong. Please try again."

==================================================

31. SAMPLE DATA

==================================================

Seed realistic sample data for development/demo.

Animals:

- Murrah Buffalo — ₹85,000 — Guntur

- Boer Goat — ₹22,000 — Vijayawada

- Gir Cow — ₹65,000 — Ongole

- Sirohi Goat — ₹20,000 — Prakasam

- Labrador Dog — ₹35,000

- Persian Cat — ₹18,000

- Country Chicken — appropriate realistic price

- Horse — appropriate realistic price

Use realistic Indian locations.

Use realistic Indian Rupee formatting:

₹85,000

₹22,000

==================================================

32. IMAGE HANDLING

==================================================

Use high-quality livestock imagery.

The animal images should look realistic, natural and trustworthy.

Do not use obviously AI-looking animal images where possible.

Use consistent image aspect ratios.

Allow multiple listing photos.

Use image optimization/lazy loading.

==================================================

33. RESPONSIVE DESKTOP

==================================================

Although mobile is the priority, create a beautiful desktop web layout.

Desktop:

- sidebar or top navigation where appropriate

- multi-column animal grid

- large admin dashboard

- desktop chat layout

- responsive feed store

Mobile:

- bottom navigation

- single-column cards

- bottom sheets

- mobile-friendly filters

==================================================

34. PERFORMANCE

==================================================

Optimize for:

- Android mid-range phones

- slow mobile networks

- large image collections

Use:

- lazy loading

- pagination

- infinite scrolling where appropriate

- optimized image dimensions

- skeleton loaders

- debounced search

- cached data where appropriate

==================================================

35. CODE QUALITY

==================================================

Create reusable components.

Examples:

AnimalCard

AnimalCarousel

AnimalDetails

CategoryCard

VerifiedBadge

PriceDisplay

LocationDisplay

OfferCard

ChatMessage

SellerCard

FeedProductCard

BottomNavigation

SearchBar

FilterSheet

ImageUploader

StatusBadge

EmptyState

LoadingSkeleton

ConfirmationDialog

Use TypeScript types/interfaces.

Avoid duplicated code.

Keep business logic separated from UI.

==================================================

36. FINAL USER FLOW

==================================================

MAIN BUY FLOW:

Splash

→ OTP Login

→ Home

→ Select Animal Category

→ Search/Filter

→ Animal Details

→ Add to Interested/Cart

→ Login if not authenticated

→ Chat Seller

→ Make Offer

→ Seller Accepts

→ Arrange Meeting

→ Meet Seller

→ Purchase privately between parties

SELL FLOW:

Login

→ Profile Verification

→ Admin Approval

→ Sell

→ Select Animal

→ Add Details

→ Upload Photos

→ Location

→ Preview

→ Submit

→ Admin Review

→ Approved

→ Listing Live

→ Buyer Chat

→ Offer

→ Sell Animal

→ Mark Sold

FEED SHOP FLOW:

Home

→ Feed

→ Product

→ Add to Cart

→ Checkout

→ Address

→ Payment

→ Order Confirmation

→ My Orders

→ Delivery Status

==================================================

37. IMPORTANT IMPLEMENTATION PRIORITY

==================================================

Build the application in this order:

PHASE 1:

- Branding

- Authentication

- Profiles

- Admin verification

- Home

- Animal categories

- Animal listings

- Search/filter

- Animal details

PHASE 2:

- Sell animal

- Admin listing approval

- Favorites

- Animal interested/cart

- Offers

- Chat

PHASE 3:

- Feed store

- Products

- Feed cart

- Checkout

- Payment architecture

- Orders

PHASE 4:

- Notifications

- Reports

- Polish

- Animations

- Performance

- Capacitor compatibility

Do not build fake backend functionality just to make the UI appear functional.

Where a real external integration is required, structure the code cleanly and clearly identify environment variables/configuration required.

==================================================

38. MOST IMPORTANT VISUAL REQUIREMENT

==================================================

The finished application should feel like a premium Indian livestock marketplace startup.

Think:

OLX marketplace simplicity

+

modern e-commerce

+

agricultural/farm identity

+

WhatsApp-like seller communication

+

premium Framer Motion animations.

The first impression should be:

"Wow, this looks like a real startup application."

NOT:

"AI generated dashboard."

Use the uploaded reference screens as inspiration but create a significantly cleaner and more polished implementation.

Brand name everywhere:

FARMZTRADE

Tagline:

Better Care. Better Growth. Better Tomorrow.

Build the complete application with functional navigation, realistic sample data, responsive UI, Supabase-ready backend architecture, OTP authentication architecture, role-based admin functionality, realtime chat architecture, offers, animal marketplace, and the Feed e-commerce module.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4162e1f4-5ac0-4816-b334-5eae5bcfbab9).

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
