const apparelImg = "/images/redesign/media__1783408531215.png";
const shoesCategory = "https://lh3.googleusercontent.com/aida-public/AB6AXuCzqot-ogiJELUahh_Lu2_kO-ivxnd4WgC2ZpX80rJN4KVFNg8se0Wltumxz73QBDA8cCiO4Sf4bCjRBi66aNenQBX5B0m-wR21jJF45mA7mJCac0IrBaAG9vbbc-NfNian9OwnO9-Zue-N_qyYAvTQMPugc5pwupscE4YhM2lDxNQ_goMaPc4AYaPR9bFUBM00yEZ1G4n4rh-oBZnKsfNwRwghAXwSpTgoArv-EmL5CeggOdFbTbAcZVh_SCaI50rk6-MMoIjJx9_F";
const bagsCategory = "https://lh3.googleusercontent.com/aida-public/AB6AXuAlmuNp9PDjf_1CUvfQBz5315dzAPAUAqw0rzwvYww8TcNkDQ8sEyaASj2NSDfv1bNlBTLKTvojupmVbJlyWLUVMx-yuWz2Z2jfYky_jyRCm3sm7pIrWd1EX7OUKVJWykgieEVXrmm8nfS7W5y0VfB11NUdlzZwR-CRmavluHxx0jhn5QtNAtFmFzXVRunYYKb2ppM7fYc-pVMdQof5XYo99_jjViHf-5T9G2eeELgbXjq-26XtHT49SeTkogXq5z225FAIKirFnuhp";
const artworkImg = "/images/redesign/media__1783408500942.png";
const booksImg = "/images/redesign/media__1783408531361.png";
const turbansImg = "/images/redesign/media__1783410273922.png";
const instrumentsImg = "/images/redesign/media__1783408531242.png";

const emojiSvg = (emoji) => `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;

export const categories = [
  // 5 Main Redesigned Categories (Root Categories)
  { id: "fashion", name: "Apparel", description: "Clothing and Apparel", image: apparelImg },
  { id: "2e70d5e5-ae8f-4c72-823c-8568f12877a8", name: "Turbans", description: "Traditional Sikh Turbans", image: turbansImg },
  { id: 7, name: "Musical Instruments", description: "Kirtan instruments", image: instrumentsImg },
  { id: "books", name: "Books", description: "Religious and educational books", image: booksImg },
  { id: 6, name: "Artwork", description: "Spiritual wall frames and carvings", image: artworkImg },

  // Fashion Subcategories
  { id: "patkas", name: "Patkas", description: "Comfortable patkas", image: apparelImg, parentId: "fashion" },
  { id: "dastar-accessories", name: "Dastar accessories", description: "Pins and accessories", image: apparelImg, parentId: "fashion" },
  { id: "sikh-inspired-clothing", name: "Sikh-inspired clothing", description: "Graphic tees and apparel", image: apparelImg, parentId: "fashion" },
  { id: "hoodies", name: "Hoodies", description: "Warm hoodies", image: apparelImg, parentId: "fashion" },
  { id: "t-shirts", name: "T-shirts", description: "Casual t-shirts", image: apparelImg, parentId: "fashion" },
  { id: "jackets", name: "Jackets", description: "Winter jackets", image: apparelImg, parentId: "fashion" },
  { id: "scarves", name: "Scarves", description: "Beautiful scarves", image: apparelImg, parentId: "fashion" },
  { id: "children's-clothing", name: "Children's clothing", description: "Kids wear", image: apparelImg, parentId: "fashion" },

  // Other Categories & Subcategories
  { id: 1, name: "Nishan Sahib", description: "Sacred flags and accessories", image: emojiSvg('🚩') },
  { id: "nishan-flags", name: "Flags", description: "Nishan Sahib flags", image: emojiSvg('🚩'), parentId: 1 },
  { id: "nishan-poles", name: "Poles & Cholas", description: "Poles and coverings", image: emojiSvg('⛩️'), parentId: 1 },

  { id: 3, name: "Accessories", description: "Turbans, dupattas, and more", image: bagsCategory },
  { id: "jewelry", name: "Jewelry", description: "Traditional jewelry", image: emojiSvg('💍'), parentId: 3 },
  { id: "watches", name: "Watches", description: "Wrist watches", image: emojiSvg('⌚'), parentId: 3 },

  { id: 4, name: "Kakaars", description: "The 5 Ks of Sikhism", image: shoesCategory },
  { id: "kara", name: "Kara", description: "Iron bracelets", image: emojiSvg('⭕'), parentId: 4 },
  { id: "kanga", name: "Kanga", description: "Wooden combs", image: emojiSvg('🪮'), parentId: 4 },
  { id: "kirpan", name: "Kirpan", description: "Ceremonial swords", image: emojiSvg('🗡️'), parentId: 4 },

  { id: "pens", name: "Pens & Pencils", description: "Writing instruments", image: emojiSvg('🖊️'), parentId: "books" },

  { id: 8, name: "Kids & Family", description: "Toys, games, and family items", image: emojiSvg('🧸') },
  { id: 9, name: "Digital Products", description: "Audio, video, and e-books", image: emojiSvg('💻') },
  { id: 10, name: "Gurudwara Items", description: "Essential items for Gurudwara", image: emojiSvg('🏛️') },
  { id: 11, name: "Prakash & Sewa Items", description: "Items for Prakash and Sewa", image: emojiSvg('🪔') },
  { id: 12, name: "Langar Hall Supplies", description: "Utensils and supplies for Langar", image: emojiSvg('🍽️') },
];
