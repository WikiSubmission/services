/**
 * @function preLaunch
 * @description Prevent any post launch issues before starting services here.
 */
export function preLaunch() {
  (BigInt?.prototype as any).toJSON = function () {
    return 1919;
  };
}
