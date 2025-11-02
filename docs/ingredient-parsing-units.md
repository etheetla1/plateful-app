# Ingredient Parsing and Unit Increments

This document describes the unit increments and rounding rules used for ingredient parsing and scaling in Plateful.

## Unit Increment Rules

When scaling recipes, quantities are rounded to reasonable cooking measurements based on the unit type. The following increments are used:

### Small Volume Measurements (tsp, tbsp)
- **Increments**: Rounded to nearest fraction
- **Preferred fractions**: 1/8, 1/4, 1/3, 1/2, 2/3, 3/4, 1.0, 1.5, 2.0, 2.5, 3.0
- **Display format**: Fractions for values < 3 (e.g., "1/2 tsp", "1 1/4 tbsp")

### Medium Volume (cups, fl oz)
- **Increments**: 0.25 (quarter cups/ounces)
- **Examples**: 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, etc.
- **Display format**: Fractions for values < 2 (e.g., "1/4 cup", "1 1/2 cups")

### Weight Measurements

#### Small Weight (g, oz) - Small amounts
- **< 10 units**: 0.25 increments
- **Examples**: 0.25, 0.5, 0.75, 1.0, 1.25, etc.

#### Small Weight (g, oz) - Medium amounts
- **10-100 units**: 0.5 increments
- **Examples**: 10, 10.5, 11, 11.5, etc.

#### Small Weight (g, oz) - Large amounts
- **≥ 100 units**: Whole numbers only
- **Examples**: 100, 101, 102, etc.

#### Pounds (lb)
- **Increments**: 0.25 (quarter pounds)
- **Examples**: 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, etc.

#### Kilograms (kg)
- **< 1 kg**: 0.1 increments
- **≥ 1 kg**: 0.25 increments
- **Examples**: 0.1, 0.2, 0.5, 0.75, 1.0, 1.25, 1.5, etc.

### Volume Measurements (ml, l)

#### Milliliters (ml)
- **< 100 ml**: 5 ml increments
- **≥ 100 ml**: Whole numbers only
- **Examples**: 5, 10, 15, 20, 25, 100, 101, 102, etc.

#### Liters (l)
- **Increments**: 0.25 (quarter liters)
- **Examples**: 0.25, 0.5, 0.75, 1.0, 1.25, etc.

### Count Items

Items without units (count items like "4 chicken thighs", "3 eggs"):
- **Increments**: Whole numbers only
- **Always rounded**: Values are rounded to nearest integer
- **Examples**: 1, 2, 3, 4, etc.

#### Specific Count Units
The following units are treated as count items (whole numbers only):
- pieces
- cloves
- eggs
- strips
- boxes
- cans
- bunches

### Default Rules

For units not explicitly listed above:
- **< 1**: 0.25 increments
- **≥ 1**: Whole numbers only

## Fraction Display

When displaying quantities, the system uses fraction notation for small values:

### Supported Fractions
- 1/8
- 1/4
- 1/3
- 1/2
- 2/3
- 3/4

### Mixed Fractions
For values > 1 with fractional parts:
- "2 1/2" (2.5)
- "3 1/4" (3.25)
- "1 1/3" (1.33...)

### Fraction Display Rules
- **tsp/tbsp**: Fractions used for values < 3
- **cups**: Fractions used for values < 2
- **Other units**: Fractions only when the value exactly matches a supported fraction

## Quantity Range Handling

When recipes specify quantity ranges (e.g., "3-4 tablespoons"):
- **Normalization**: Range is converted to average value
- **Small ranges (< 5)**: Rounded to 0.25 increments
- **Larger ranges (≥ 5)**: Rounded to whole numbers
- **Example**: "3-4 tablespoons" → 3.5 tablespoons → "3 1/2 tablespoons"

## Supported Units

### Volume Units
- **tbsp** / **tablespoon** / **tablespoons** / **T**
- **tsp** / **teaspoon** / **teaspoons**
- **cup** / **cups**
- **fl oz** / **fluid ounce** / **fluid ounces**
- **ml** / **milliliter** / **milliliters** / **millilitre** / **millilitres**
- **l** / **liter** / **liters** / **litre** / **litres**

### Weight Units
- **oz** / **ounce** / **ounces**
- **lb** / **lbs** / **pound** / **pounds**
- **g** / **gram** / **grams**
- **kg** / **kilogram** / **kilograms**

### Count Units
- **piece** / **pieces**
- **clove** / **cloves**
- **egg** / **eggs**
- **strip** / **strips**
- **box** / **boxes**
- **can** / **cans**
- **bunch** / **bunches**

## Examples

### Scaling Examples

**Original (4 servings)** → **Scaled (8 servings)**:
- "1/4 cup fresh lemon juice" → "1/2 cup fresh lemon juice" (0.25 × 2 = 0.5)
- "2 1/2 tsp kosher salt" → "5 tsp kosher salt" (2.5 × 2 = 5.0)
- "3-4 tbsp garlic oil" → "7 tbsp garlic oil" (3.5 × 2 = 7.0, rounded)
- "4 chicken thighs" → "8 chicken thighs" (4 × 2 = 8)

**Original (4 servings)** → **Scaled (5 servings)**:
- "1/4 cup fresh lemon juice" → "1/3 cup fresh lemon juice" (0.25 × 1.25 = 0.3125, rounded to nearest fraction)
- "2 cups flour" → "2.5 cups flour" (2 × 1.25 = 2.5)
- "1 lb potatoes" → "1.25 lb potatoes" (1 × 1.25 = 1.25)

### Parsing Examples

- "1/4 cup fresh lemon juice" → `quantity: 0.25, unit: "cups", name: "fresh lemon juice"`
- "2 1/2 tsp black pepper" → `quantity: 2.5, unit: "tsp", name: "black pepper"`
- "3-4 tablespoons garlic-infused oil" → `quantity: 3.5, unit: "tbsp", name: "garlic-infused oil"`
- "4 bone-in, skin-on chicken thighs" → `quantity: 4, unit: "", name: "chicken thighs", notes: "bone-in, skin-on"`

