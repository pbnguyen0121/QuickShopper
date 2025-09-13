// modules/product-util.js

const products = [
    {
      title: "Hendrix Velvet Barrel Chair",
      description: "This seashell-inspired barrel chair adds a touch of texture to your living room.",
      category: "Living Room Furniture",
      price: 549.99,
      salePrice: 319.99,
      shippingWeight: 25,
      shippingWidth: 150,
      shippingLength: 150,
      shippingHeight: 150,
      imageUrl: "chair.png",
      featured: true
    },
    {
      title: "Modern Sofa",
      description: "A comfortable sofa that fits perfectly in any modern living room.",
      category: "Living Room Furniture",
      price: 799.99,
      salePrice: 599.99,
      shippingWeight: 40,
      shippingWidth: 200,
      shippingLength: 90,
      shippingHeight: 85,
      imageUrl: "sofa.png",
      featured: true
    },
    {
      title: "Classic Coffee Table",
      description: "A beautiful coffee table meticulously crafted from reclaimed wood, adding a touch of rustic.",
      category: "Living Room Furniture",
      price: 299.99,
      salePrice: 199.99,
      shippingWeight: 20,
      shippingWidth: 120,
      shippingLength: 60,
      shippingHeight: 45,
      imageUrl: "coffeetable.png",
      featured: true
    },
    {
      title: "Contemporary TV Stand",
      description: "Sleek and modern TV stand with ample storage.",
      category: "Living Room Furniture",
      price: 399.99,
      salePrice: 279.99,
      shippingWeight: 35,
      shippingWidth: 180,
      shippingLength: 40,
      shippingHeight: 50,
      imageUrl: "tvstand.png",
      featured: true
    },
    {
      title: "Queen Bed Frame",
      description: "Elegant queen bed frame with a minimalist design.",
      category: "Bedroom Furniture",
      price: 499.99,
      salePrice: 349.99,
      shippingWeight: 50,
      shippingWidth: 210,
      shippingLength: 200,
      shippingHeight: 100,
      imageUrl: "bedframe.png",
      featured: true
    },
    {
      title: "Nightstand",
      description: "Compact and stylish nightstand to complement your bed.",
      category: "Bedroom Furniture",
      price: 149.99,
      salePrice: 99.99,
      shippingWeight: 15,
      shippingWidth: 50,
      shippingLength: 40,
      shippingHeight: 45,
      imageUrl: "nightstand.png",
      featured: true
    }
  ];
  
  module.exports.getAllProducts = function () {
    return products;
  };
  
  module.exports.getFeaturedProducts = function () {
    const featuredProducts = [];
    for (let i = 0; i < products.length; i++) {
      if (products[i].featured) {
        featuredProducts.push(products[i]);
      }
    }
    return featuredProducts;
  };
  
  module.exports.getProductsByCategory = function (products) {
    const grouped = {};
  for (const product of products) {
    if (!grouped[product.category]) {
      grouped[product.category] = [];
    }
    grouped[product.category].push(product);
  }
  return Object.keys(grouped).map(category => ({
    category: category,
    products: grouped[category]
  }));
  };
  