# Feature: Simplify Inventory with Piles

We recently added a feature to the application where you can add articles of clothing to
your inventory.

The feature currently has 3 top-level categories; shirt/pants/base, and then this drops down into
sub-categories. Also, remember that each article of clothing is named and tracked individually.

We recently discovered that, as a user, we do NOT want to name and individually track our base clothing.
This includes underwear, shirts, and socks. We want to treat them in bulk. For example, I'll just have 10 pieces of underwear.

The abstraction we are going to use on the frontend is called "Piles". You see, we are going to hardcode 4 piles into
the application:

- Underwear
- Socks
- Undershirts
- Tank Tops

## UI

On the UI, piles are rows similar to our individual pieces of clothing. Here is what is special about them:

- Instead of the `wears` meter, they have a stepper for incrementing and decrementing the number of clean items. For example, [-] 7/10 [+].
- If all in a pile are dirty, the minus button is disabled. If all in a pile are clean, the plus button is enabled.
- There is a chevron on the right of the row >. It allows changing the _total amount_ in the pile. If I buy more inventory, I go here.
- Remove the base category from the Add Inventory flow. We are now treating inventory as these personal, intimate pieces of clothes, and these 4 base piles are so commonplace that they aren't worth being her anymore.
- These 4 rows are at the top of the inventory list because they are accessed so commonly.

## Technical Concerns

On the technical side of things:

- Continue using Supabase as the database.
- Remove any old reference to these base layers in the `items` table or anywhere else. From here on out, they are Piles.
- Define a new table `piles`. It should have a `total` and `dirty` column, both numbers. Derive clean if needed; I'm not even sure if you need to explicitly.
- Similar to how each user gets their own rows for items of clothing, each user their own rows for piles. Remember that each hosue has it's own piles. Therefore, if a user has 2 houses, they have 8 piles.
