# NYC demo walkthrough

Open http://localhost:5173. Demo emails/passwords are in the repository README.
Each account opens the appropriate workspace automatically.

1. **Donor / Event planning:** view the seeded menus or save your own event.
   Upload a menu image when Gemini is configured; otherwise use manual entry.
   Check every dish, ingredient list, allergen, and handling suggestion.
2. **Donor / Leftover triage:** choose a started event, select remaining dishes,
   enter servings, take a real stage 1 photo, and create a batch from the event
   location. The driver's event QR is displayed beside the form.
3. **Center / My facility:** review hours, location, equipment, seats and staff.
   The permanent location QR is the entrance code used by arriving drivers.
4. **Central NGO / Dispatch & routes:** match a pending batch after checking
   equipment and capacity. A free driver with suitable transport is required.
   The seeded driver already has one active assignment; complete or reject it
   before assigning that driver another route.
5. **Driver / My handoffs:** scan the assigned event QR, record stage 2 evidence,
   and scan an unused tracking sticker. Each accepted action captures fresh GPS.
   A phone camera scans actual QR codes; entering a printed ID is also supported
   and still requires location verification.
6. **Driver arrival:** follow the Google Maps directions link to the center.
   Scan its entrance QR to record arrival.
7. **Center / Intake & feedback:** scan the container sticker and take a stage 3
   arrival photo. Delivery finalizes here, not in the driver's account.
8. **Central NGO / Chain of custody:** inspect all three photos, hashes,
   timestamps, and the scan audit. Inspect private feedback in moderation.
9. **Consumer concept:** open /consumer. Filter the fictional dishes by allergen,
   preview transit directions, and try the private feedback preview. No consumer
   data is sent or saved, and no public ratings appear.

Seeded fixture locations and images are explicitly synthetic. For a real device
demo, use current GPS when registering your event and center so the proximity
checks agree with your venue. Alternatively, a developer can deliberately set a
browser's location simulation to the seeded coordinates; that is simulated
evidence, not a real pickup. The server never silently substitutes NYC GPS when
location permission is denied.

Seeded pickup: 40.7306, -73.9866. Seeded center: 40.7265, -73.9815.
Photo/scan proximity defaults to 250 meters. Device camera/location requires
localhost or HTTPS. Live map tiles need internet connectivity; markers and the
underlying batch records remain available when tiles fail.
