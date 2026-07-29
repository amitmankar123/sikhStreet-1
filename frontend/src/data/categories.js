const apparelImg = "/images/redesign/media__1783408531215.png";
const shoesCategory = "https://lh3.googleusercontent.com/aida-public/AB6AXuCzqot-ogiJELUahh_Lu2_kO-ivxnd4WgC2ZpX80rJN4KVFNg8se0Wltumxz73QBDA8cCiO4Sf4bCjRBi66aNenQBX5B0m-wR21jJF45mA7mJCac0IrBaAG9vbbc-NfNian9OwnO9-Zue-N_qyYAvTQMPugc5pwupscE4YhM2lDxNQ_goMaPc4AYaPR9bFUBM00yEZ1G4n4rh-oBZnKsfNwRwghAXwSpTgoArv-EmL5CeggOdFbTbAcZVh_SCaI50rk6-MMoIjJx9_F";
const bagsCategory = "https://lh3.googleusercontent.com/aida-public/AB6AXuAlmuNp9PDjf_1CUvfQBz5315dzAPAUAqw0rzwvYww8TcNkDQ8sEyaASj2NSDfv1bNlBTLKTvojupmVbJlyWLUVMx-yuWz2Z2jfYky_jyRCm3sm7pIrWd1EX7OUKVJWykgieEVXrmm8nfS7W5y0VfB11NUdlzZwR-CRmavluHxx0jhn5QtNAtFmFzXVRunYYKb2ppM7fYc-pVMdQof5XYo99_jjViHf-5T9G2eeELgbXjq-26XtHT49SeTkogXq5z225FAIKirFnuhp";
const artworkImg = "/images/redesign/media__1783408500942.png";
const booksImg = "/images/redesign/media__1783408531361.png";
const turbansImg = "/images/redesign/turban_logo.jpg";
const instrumentsImg = "/images/redesign/media__1783408531242.png";

const emojiSvg = (emoji) => `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;

export const categories = [
  // 5 Main Redesigned Categories (Root Categories)
  { id: "fashion", name: "Apparel", description: "Clothing and Apparel", image: apparelImg },
  { id: "2e70d5e5-ae8f-4c72-823c-8568f12877a8", name: "Turbans", description: "Traditional Sikh Turbans", image: turbansImg },
  { id: 7, name: "Musical Instruments", description: "Kirtan instruments", image: instrumentsImg },
  { id: "books", name: "Books and Literature", description: "Religious and educational books", image: booksImg },
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
  { id: 1, name: "Nishan Sahib", description: "Sacred flags and accessories", image: "/images/redesign/nishan_sahib.jpg" },
  { id: "nishan-flags", name: "Flags", description: "Nishan Sahib flags", image: "/images/redesign/nishan_sahib.jpg", parentId: 1 },
  { id: "nishan-poles", name: "Poles & Cholas", description: "Poles and coverings", image: emojiSvg('⛩️'), parentId: 1 },

  { id: 3, name: "Accessories", description: "Turbans, dupattas, and more", image: bagsCategory },
  { id: "kadda", name: "Kadda", description: "Premium Sikh Kaddas", image: emojiSvg('⭕'), parentId: 3 },
  { id: "jewelry", name: "Jewelry", description: "Traditional jewelry", image: emojiSvg('💍'), parentId: 3 },
  { id: "watches", name: "Watches", description: "Wrist watches", image: emojiSvg('⌚'), parentId: 3 },

  { id: 4, name: "Kakaars", description: "The 5 Ks of Sikhism", image: shoesCategory },
  { id: "kara", name: "Kara", description: "Iron bracelets", image: emojiSvg('⭕'), parentId: 4 },
  { id: "kanga", name: "Kanga", description: "Wooden combs", image: emojiSvg('🪮'), parentId: 4 },
  { id: "kirpan", name: "Kirpan", description: "Ceremonial swords", image: emojiSvg('🗡️'), parentId: 4 },

  // Book & Literature Subcategories (Aligned with design image and seed script)
  { id: "sikh-history-books", name: "Sikh History", description: "Sikh history and educational books", image: booksImg, parentId: "books" },
  { id: "childrens-books", name: "Children's Books", description: "Sikhism and Gurmat books for children", image: booksImg, parentId: "books" },
  { id: "punjabi-literature", name: "Punjabi Literature", description: "Classic and contemporary Punjabi literature", image: booksImg, parentId: "books" },
  { id: "biographies-sikh-personalities", name: "Biographies", description: "Biographies of Gurus and Sikh warriors", image: booksImg, parentId: "books" },
  { id: "language-learning-books", name: "Language & Learning", description: "Learn Punjabi and Gurmukhi scripts", image: booksImg, parentId: "books" },
  { id: "journals-notebooks", name: "Academic & Research", description: "Journals, academic research, and notebooks", image: booksImg, parentId: "books" },
  { id: "punjab", name: "Punjab & Politics", description: "Books about Punjab state, history, politics and culture", image: booksImg, parentId: "books" },
  { id: "e-books", name: "Digital & E-books", description: "E-books and digital reading materials", image: booksImg, parentId: "books" },

  // Level 3 Topics under sikh-history-books
  { id: "gurus-topic", name: "Gurus", parentId: "sikh-history-books", group: "Sikhism" },
  { id: "gurbani-studies-topic", name: "Gurbani Studies", parentId: "sikh-history-books", group: "Sikhism" },
  { id: "sikh-philosophy-topic", name: "Sikh Philosophy", parentId: "sikh-history-books", group: "Sikhism" },
  { id: "sikh-practices-topic", name: "Sikh Practices", parentId: "sikh-history-books", group: "Sikhism" },
  { id: "sikh-rehat-topic", name: "Sikh Rehat", parentId: "sikh-history-books", group: "Sikhism" },
  { id: "sikh-theology-topic", name: "Sikh Theology", parentId: "sikh-history-books", group: "Sikhism" },
  { id: "sikh-symbols-topic", name: "Sikh Symbols", parentId: "sikh-history-books", group: "Sikhism" },
  { id: "sikh-history-general-topic", name: "Sikh History", parentId: "sikh-history-books", group: "History" },
  { id: "punjab-history-topic", name: "Punjab History", parentId: "sikh-history-books", group: "History" },
  { id: "partition-topic", name: "Partition", parentId: "sikh-history-books", group: "History" },
  { id: "sikh-empire-topic", name: "Sikh Empire", parentId: "sikh-history-books", group: "History" },
  { id: "freedom-movement-topic", name: "Freedom Movement", parentId: "sikh-history-books", group: "History" },
  { id: "military-history-topic", name: "Military History", parentId: "sikh-history-books", group: "History" },

  // Level 3 Topics under childrens-books
  { id: "picture-books-topic", name: "Picture Books", parentId: "childrens-books", group: "Children & Young Readers" },
  { id: "early-readers-topic", name: "Early Readers", parentId: "childrens-books", group: "Children & Young Readers" },
  { id: "activity-books-topic", name: "Activity Books", parentId: "childrens-books", group: "Children & Young Readers" },
  { id: "educational-books-topic", name: "Educational Books", parentId: "childrens-books", group: "Children & Young Readers" },
  { id: "bedtime-stories-topic", name: "Bedtime Stories", parentId: "childrens-books", group: "Children & Young Readers" },
  { id: "sikh-values-topic", name: "Sikh Values", parentId: "childrens-books", group: "Children & Young Readers" },
  { id: "comics-topic", name: "Comics", parentId: "childrens-books", group: "Children & Young Readers" },
  { id: "historical-comics-topic", name: "Historical Comics", parentId: "childrens-books", group: "Children & Young Readers" },
  { id: "graphic-novels-topic", name: "Graphic Novels", parentId: "childrens-books", group: "Children & Young Readers" },

  // Level 3 Topics under punjabi-literature
  { id: "fiction-topic", name: "Fiction", parentId: "punjabi-literature", group: "Punjabi Literature" },
  { id: "short-stories-topic", name: "Short Stories", parentId: "punjabi-literature", group: "Punjabi Literature" },
  { id: "poetry-topic", name: "Poetry", parentId: "punjabi-literature", group: "Punjabi Literature" },
  { id: "classic-lit-topic", name: "Classic Literature", parentId: "punjabi-literature", group: "Punjabi Literature" },
  { id: "contemporary-lit-topic", name: "Contemporary Literature", parentId: "punjabi-literature", group: "Punjabi Literature" },

  // Level 3 Topics under biographies-sikh-personalities
  { id: "biography-gurus-topic", name: "Gurus", parentId: "biographies-sikh-personalities", group: "Biographies" },
  { id: "sikh-warriors-topic", name: "Sikh Warriors", parentId: "biographies-sikh-personalities", group: "Biographies" },
  { id: "saints-topic", name: "Saints", parentId: "biographies-sikh-personalities", group: "Biographies" },
  { id: "scholars-topic", name: "Scholars", parentId: "biographies-sikh-personalities", group: "Biographies" },
  { id: "modern-personalities-topic", name: "Modern Sikh Personalities", parentId: "biographies-sikh-personalities", group: "Biographies" },

  // Level 3 Topics under language-learning-books
  { id: "punjabi-lang-topic", name: "Punjabi", parentId: "language-learning-books", group: "Language & Learning" },
  { id: "gurmukhi-lang-topic", name: "Gurmukhi", parentId: "language-learning-books", group: "Language & Learning" },
  { id: "shahmukhi-lang-topic", name: "Shahmukhi", parentId: "language-learning-books", group: "Language & Learning" },
  { id: "dictionaries-lang-topic", name: "Dictionaries", parentId: "language-learning-books", group: "Language & Learning" },
  { id: "grammar-lang-topic", name: "Grammar", parentId: "language-learning-books", group: "Language & Learning" },
  { id: "workbooks-lang-topic", name: "Workbooks", parentId: "language-learning-books", group: "Language & Learning" },
  { id: "persian-lang-topic", name: "Persian", parentId: "language-learning-books", group: "Language & Learning" },
  { id: "urdu-lang-topic", name: "Urdu", parentId: "language-learning-books", group: "Language & Learning" },
  { id: "sanskrit-lang-topic", name: "Sanskrit", parentId: "language-learning-books", group: "Language & Learning" },

  // Level 3 Topics under journals-notebooks (Academic & Research)
  { id: "research-papers-topic", name: "Research Papers", parentId: "journals-notebooks", group: "Academic & Research" },
  { id: "journals-topic", name: "Journals", parentId: "journals-notebooks", group: "Academic & Research" },
  { id: "reference-books-acad-topic", name: "Reference Books", parentId: "journals-notebooks", group: "Academic & Research" },
  { id: "encyclopedias-topic", name: "Encyclopedias", parentId: "journals-notebooks", group: "Academic & Research" },
  { id: "university-texts-topic", name: "University Texts", parentId: "journals-notebooks", group: "Academic & Research" },

  // Level 3 Topics under punjab (Punjab & Politics)
  { id: "punjab-history-pol-topic", name: "Punjab History", parentId: "punjab", group: "Punjab & Politics" },
  { id: "sikh-identity-topic", name: "Sikh Identity", parentId: "punjab", group: "Punjab & Politics" },
  { id: "politics-pol-topic", name: "Politics", parentId: "punjab", group: "Punjab & Politics" },
  { id: "human-rights-topic", name: "Human Rights", parentId: "punjab", group: "Punjab & Politics" },
  { id: "diaspora-topic", name: "Diaspora", parentId: "punjab", group: "Punjab & Politics" },
  { id: "gender-studies-topic", name: "Gender Studies", parentId: "punjab", group: "Punjab & Politics" },

  // Level 3 Topics under e-books (Digital & E-books)
  { id: "fiction-ebook-topic", name: "Fiction", parentId: "e-books", group: "Digital & E-books" },
  { id: "poetry-ebook-topic", name: "Poetry", parentId: "e-books", group: "Digital & E-books" },
  { id: "sikh-history-ebook-topic", name: "Sikh History", parentId: "e-books", group: "Digital & E-books" },
  { id: "punjabi-ebook-topic", name: "Punjabi", parentId: "e-books", group: "Digital & E-books" },
  { id: "reference-books-ebook-topic", name: "Reference Books", parentId: "e-books", group: "Digital & E-books" },

  { id: 8, name: "Kids & Family", description: "Toys, games, and family items", image: "/images/redesign/kids_family.png" },
  { id: 9, name: "Digital Products", description: "Audio, video, and e-books", image: "/images/redesign/digital_products.png" },
  { id: 10, name: "Gurudwara Items", description: "Essential items for Gurudwara", image: "/images/redesign/gurudwara_items.png" },
  { id: 11, name: "Prakash & Sewa Items", description: "Items for Prakash and Sewa", image: emojiSvg('🪔') },
  { id: 12, name: "Langar Hall Supplies", description: "Utensils and supplies for Langar", image: "/images/redesign/langar_supplies.png" },
];
