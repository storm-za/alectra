import { db } from "../server/db";
import { products, productReviews } from "@shared/schema";

// Realistic South African names
const firstNames = [
  "Thabo", "Sipho", "Nomsa", "Lerato", "Andries", "Johan", "Susan", "Linda",
  "Patrick", "Mary", "David", "Sarah", "Michael", "Jennifer", "Peter", "Lisa",
  "Johannes", "Maria", "Pieter", "Anna", "Nkosi", "Zanele", "Trevor", "Michelle",
  "Ruben", "Chantal", "Marco", "Nicole", "Ayanda", "Themba", "Precious", "Lucky"
];

const lastNames = [
  "van der Merwe", "Botha", "Naidoo", "Mthembu", "Smith", "Williams", "Jones",
  "Dlamini", "Khumalo", "Nel", "Visser", "Steyn", "van Zyl", "Pillay", "Chetty",
  "Govender", "Mbatha", "Molefe", "Radebe", "Tshabalala", "du Plessis", "Fourie"
];

// Review templates for different star ratings
const fiveStarComments = [
  "Excellent product! Works perfectly.",
  "Best gate motor I've ever used. Highly recommend!",
  "Very happy with this purchase. Installation was straightforward.",
  "Quality product, worth every cent!",
  "Exceeded my expectations. Great value for money.",
  "Fantastic! No issues at all.",
  "Professional quality. Very satisfied.",
  "This is exactly what I needed. Perfect!",
  "Top quality product. Would buy again.",
  "Outstanding product and performance.",
  "",  // Just rating, no comment
  "Great product! Working like a charm.",
  "Reliable and well-made.",
  "Very pleased with the quality.",
  "Perfect for my needs."
];

const fourStarComments = [
  "Good product, does the job well.",
  "Works great, just wish it was a bit cheaper.",
  "Happy with the purchase. Good quality.",
  "Solid product. Minor installation quirks but overall good.",
  "Does what it says. Satisfied.",
  "Good value. Working well so far.",
  "Decent product. Meets expectations.",
  "",  // Just rating, no comment
  "Works nicely. Installation could be easier.",
  "Good product for the price.",
  "No complaints. Works as expected.",
  "Satisfied with this purchase."
];

const threeStarComments = [
  "It's okay. Does the job but nothing special.",
  "Average product. Gets the work done.",
  "Works fine but had some installation issues.",
  "Decent but expected a bit more for the price.",
  "It works. Not amazing but not bad either.",
  "",  // Just rating, no comment
  "Fair product. Had to make some adjustments.",
  "Acceptable. Does what it's supposed to.",
  "Okay for the price I guess.",
  "Not bad but not great either."
];

const twoStarComments = [
  "Had some problems with installation. Works now but wasn't easy.",
  "Not entirely happy. Expected better quality.",
  "Okay but had issues getting it to work properly.",
  "Disappointed. Not as good as described.",
  "Struggled with setup. Finally got it working.",
  "",  // Just rating, no comment
  "Could be better. Had a few issues.",
  "Not great. Wouldn't buy again."
];

const oneStarComments = [
  "Very disappointed. Stopped working after a week.",
  "Poor quality. Had to return it.",
  "Waste of money. Doesn't work as advertised.",
  "Terrible experience. Do not recommend.",
  "",  // Just rating, no comment
  "Not happy at all. Complete disappointment."
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomName(): string {
  return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

function getCommentForRating(rating: number): string | null {
  let comments: string[];
  switch (rating) {
    case 5:
      comments = fiveStarComments;
      break;
    case 4:
      comments = fourStarComments;
      break;
    case 3:
      comments = threeStarComments;
      break;
    case 2:
      comments = twoStarComments;
      break;
    case 1:
      comments = oneStarComments;
      break;
    default:
      comments = threeStarComments;
  }
  
  const comment = getRandomElement(comments);
  return comment === "" ? null : comment;
}

function getRandomRating(): number {
  // Weighted towards higher ratings (more realistic for products people buy)
  const rand = Math.random();
  if (rand < 0.50) return 5;  // 50% are 5-star
  if (rand < 0.75) return 4;  // 25% are 4-star
  if (rand < 0.90) return 3;  // 15% are 3-star
  if (rand < 0.97) return 2;  // 7% are 2-star
  return 1;  // 3% are 1-star
}

function getRandomDateInPast(): Date {
  // Random date within last 365 days
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 365);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function seedReviews() {
  console.log("Starting review seeding...");
  
  // Get all products
  const allProducts = await db.select().from(products);
  console.log(`Found ${allProducts.length} products`);
  
  // Check if reviews already exist
  const existingReviews = await db.select().from(productReviews).limit(1);
  if (existingReviews.length > 0) {
    console.log("Reviews already exist. Skipping seed.");
    return;
  }
  
  let totalReviews = 0;
  
  for (const product of allProducts) {
    // Random number of reviews per product (1-8)
    const reviewCount = Math.floor(Math.random() * 8) + 1;
    
    console.log(`Adding ${reviewCount} reviews for: ${product.name}`);
    
    for (let i = 0; i < reviewCount; i++) {
      const rating = getRandomRating();
      const comment = getCommentForRating(rating);
      const authorName = getRandomName();
      const createdAt = getRandomDateInPast();
      
      await db.insert(productReviews).values({
        productId: product.id,
        rating,
        comment,
        authorName,
        createdAt,
      });
      
      totalReviews++;
    }
  }
  
  console.log(`\nSeeding complete!`);
  console.log(`Added ${totalReviews} reviews across ${allProducts.length} products`);
  console.log(`Average: ${(totalReviews / allProducts.length).toFixed(1)} reviews per product`);
}

seedReviews()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding reviews:", error);
    process.exit(1);
  });
