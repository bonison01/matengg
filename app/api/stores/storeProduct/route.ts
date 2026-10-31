import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product, GroupedProducts } from '@/utils/types/product';

// Define the GET handler using query parameters
export async function GET(req: NextRequest) {
  try {
    // Extract id from query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Validate id
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID missing' },
        { status: 400 }
      );
    }

    const products = await prisma.new_products.findMany({
      where: { user_id: id },
      select: {
        id: true,
        name: true,
        user_id: true,
        description: true,
        price_inr: true,
        media_urls: true,
        category: true,
        user_name: true,
        discount_rate: true,
        discounted_price: true,
        quantity: true,
        unit: true,
        unit_quantity: true,
        updated_at: true,
      },
    });

    const formattedProducts: Product[] = products.map((product) => ({
      ...product,
      price_inr: Number(product.price_inr),
      discount_rate: product.discount_rate ? Number(product.discount_rate) : null,
      discounted_price: product.discounted_price ? Number(product.discounted_price) : null,
    }));

    const categoryOrder = [
      'Grocery', 'Instant Foods', 'Snacks', 'Soft Drinks And Juices',
      'Books', 'Electronics', 'Personal Hygiene And Health',
      'Books & Stationary', 'Fashion', 'Service', 'Others', 'Uncategorized',
    ];

    const normalizedCategoryMap: Record<string, string> = {};
    categoryOrder.forEach((cat) => { normalizedCategoryMap[cat.toLowerCase()] = cat; });

    const groupedProducts: GroupedProducts = {};
    formattedProducts.forEach((product) => {
      const rawCategory = product.category?.trim() || 'Uncategorized';
      const normalizedKey = rawCategory.toLowerCase();
      const finalCategory = normalizedCategoryMap[normalizedKey] || rawCategory;

      if (!groupedProducts[finalCategory]) groupedProducts[finalCategory] = [];
      groupedProducts[finalCategory].push(product);
    });

    const knownCategorySet = new Set(categoryOrder);
    const unknownCategories: string[] = [];
    Object.keys(groupedProducts).forEach((category) => {
      if (!knownCategorySet.has(category)) unknownCategories.push(category);
    });

    const sortedGroupedProducts: GroupedProducts = {};
    categoryOrder.forEach((category) => {
      if (groupedProducts[category]) sortedGroupedProducts[category] = groupedProducts[category];
      if (category === 'Uncategorized' && unknownCategories.length) {
        unknownCategories.forEach((unknownCategory) => {
          sortedGroupedProducts[unknownCategory] = groupedProducts[unknownCategory];
        });
      }
    });

    return NextResponse.json(
      { success: true, data: sortedGroupedProducts },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API Error fetching user products:', error);
    if (error.code === 'P1001') {
      return NextResponse.json(
        { success: false, message: 'Database connection failed.' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}