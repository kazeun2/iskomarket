export function getPrimaryImage(product: any): string {
  if (!product) return "";
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  if (product.image) return product.image;
  return "";
}
