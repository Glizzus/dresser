# Feature: Add Clothes to Inventory

As a user, I want to add articles of clothing to my inventory. This allows me to build an inventory of the clothes that I own,
which further features of the app will be built on top of.

The article of clothing should have a name.

The article of clothing should be assigned one or more categories (e. g. work shirt, casual shirt, church pants, etc.). Many articles are in multiple categories (e. g. a shirt that can be worn for work and church).

Notice that categories do form a sort of matrix. For example, a shirt can be both a "work shirt" and a "church shirt", but pants cannot be a "work shirt". Therefore, the category selection UI should be a multi-select grid, with categories grouped by type (shirts, pants, etc.). The user can select multiple categories for each article of clothing.

The article of clothing should be assigned a "wears limit", which is the number of wears it can have before it needs to be washed. It should default to 2 wears, and let it be incremented/decremented. Wears can not be 0, decimals, or negative. Do not allow numeric input for wears limit, only increment/decrement buttons.

The article of clothing should be assigned a "location", which is the house it is currently at (House A, House B, or in transit). It should default to House A. In Transit should be a smaller option given that it is rare. It should be de-emphasized, yet still easily accessible.

After the article of clothing is added, it should appear in the inventory list, grouped by category. This is where your work ends; the rest of the inventory list features will be built in later stories. This story is only about adding the article of clothing to the inventory, not about the inventory list features.

## Technical notes

The article of clothing should be added to the database so that it persists across app restarts. Use Supabase for the database, and create a table for the articles of clothing with the appropriate columns for name, categories, wears limit, and location.
