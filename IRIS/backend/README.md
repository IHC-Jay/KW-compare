# KeyWord Compare - IRIS Backend

This folder contains the initial IRIS persistent classes for comparing KeyWord files.

## Tables

- `KW_COMPARE_CONFIG`: reusable comparison configurations.
- `KW_COMPARE_CONFIG_FIELD`: fields excluded by a configuration.
- `KW_COMPARE_RUN`: one comparison execution and its summary.
- `KW_COMPARE_RUN_FIELD`: fields discovered during a comparison.
- `KW_COMPARE_DIFFERENCE`: field and record differences.
- `KW_COMPARE_ORDER_DIFFERENCE`: record ordering differences.

The classes use package `KWCompare` and can be imported and compiled in an IRIS namespace. REST endpoints and comparison logic will be added after the schema is validated on Linux.
