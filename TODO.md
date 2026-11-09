# TODO

## LiquidGlass / quick-liquid (parked)

A WIP change was discarded to keep main shippable:

- Added `quick-liquid` and reworked `src/components/common/LiquidGlass.tsx` with material presets.
- Broke call-site compatibility by removing `className` while many screens still pass it.
- Ignored explicit `cornerRadius` in favor of material border radii.
- Multiplied tint/blur values incorrectly (`tintOpacity * preset.tintOpacity` → near-invisible glass).
- Declared `quick-liquid` but never imported it; left unused imports (`useMemo`, `StyleSheet`, `Platform`, etc.).

Restore path if revisiting: reintroduce `className` on the public props, honor `cornerRadius`, use material presets as defaults only, and either wire `quick-liquid` for real or drop the dependency.
