// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { Product, GroupedProducts } from '@/utils/types/product';

// export const GET = async (req: NextRequest) => {
//   try {
//     const products = await prisma.new_products.findMany({
//       select: {
//         id: true,
//         name: true,
//         user_id: true,
//         description: true,
//         price_inr: true,
//         media_urls: true,
//         category: true,
//         user_name: true,
//         discount_rate: true,
//         discounted_price: true,
//         quantity: true,
//         unit: true,
//         unit_quantity: true,
//         updated_at: true,
//       },
//     });

//     // Format numeric fields
//     const formattedProducts: Product[] = products.map((product) => ({
//       ...product,
//       price_inr: Number(product.price_inr),
//       discount_rate: product.discount_rate ? Number(product.discount_rate) : null,
//       discounted_price: product.discounted_price ? Number(product.discounted_price) : null,
//     }));

//     // Group by category
//     const groupedProducts: GroupedProducts = formattedProducts.reduce((acc: GroupedProducts, product: Product) => {
//       const category = product.category || 'Uncategorized';
//       if (!acc[category]) acc[category] = [];
//       acc[category].push(product);
//       return acc;
//     }, {});

//     return NextResponse.json({ success: true, data: groupedProducts }, { status: 200 });
//   } catch (error: any) {
//     console.error('API Error fetching products:', error);

//     // Prisma-specific error handling (optional)
//     if (error.code === 'P1001') {
//       return NextResponse.json(
//         {
//           success: false,
//           message: 'Database connection failed. Please check if your database is running.',
//         },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json(
//       {
//         success: false,
//         message: error.message || 'Internal server error',
//       },
//       { status: 500 }
//     );
//   } finally {
//     // Optional: If not using global Prisma instance
//     // await prisma.$disconnect();
//   }
// };

// Optional: Uncomment if you want static regeneration or edge runtime
// export const revalidate = 240;
// export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product, GroupedProducts } from '@/utils/types/product';

export const GET = async (req: NextRequest) => {
  try {
    const products = await prisma.new_products.findMany({
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

    // Format numeric fields
    const formattedProducts: Product[] = products.map((product) => ({
      ...product,
      price_inr: Number(product.price_inr),
      discount_rate: product.discount_rate ? Number(product.discount_rate) : null,
      discounted_price: product.discounted_price ? Number(product.discounted_price) : null,
    }));

    // Desired category order
    const categoryOrder = [
      'Grocery',
      'Instant Foods',
      'Snacks',
      'Soft Drinks And Juices',
      'Books',
      'Electronics',
      'Personal Hygiene And Health',
      'Books & Stationary',
      'Fashion',
      'Service',
      'Others',
      'Uncategorized',
    ];

    // Create a mapping for case-insensitive category normalization
    const normalizedCategoryMap: Record<string, string> = {};
    categoryOrder.forEach((cat) => {
      normalizedCategoryMap[cat.toLowerCase()] = cat;
    });

    // Group products by normalized category
    const groupedProducts: GroupedProducts = {};
    formattedProducts.forEach((product) => {
      const rawCategory = product.category?.trim() || 'Uncategorized';
      const normalizedKey = rawCategory.toLowerCase();

      // Match to the correct case from categoryOrder or treat as unknown
      const finalCategory = normalizedCategoryMap[normalizedKey] || rawCategory;

      if (!groupedProducts[finalCategory]) groupedProducts[finalCategory] = [];
      groupedProducts[finalCategory].push(product);
    });

    // Detect unknown categories (those not part of the predefined order)
    const knownCategorySet = new Set(categoryOrder);
    const unknownCategories: string[] = [];
    Object.keys(groupedProducts).forEach((category) => {
      if (!knownCategorySet.has(category)) unknownCategories.push(category);
    });

    // Sort grouped categories based on the desired order and inject unknowns before 'Uncategorized'
    const sortedGroupedProducts: GroupedProducts = {};
    categoryOrder.forEach((category) => {
      if (groupedProducts[category]) {
        sortedGroupedProducts[category] = groupedProducts[category];
      }
      if (category === 'Uncategorized' && unknownCategories.length) {
        unknownCategories.forEach((unknownCategory) => {
          sortedGroupedProducts[unknownCategory] = groupedProducts[unknownCategory];
        });
      }
    });

    return NextResponse.json({ success: true, data: sortedGroupedProducts }, { status: 200 });
  } catch (error: any) {
    console.error('API Error fetching products:', error);

    if (error.code === 'P1001') {
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed. Please check if your database is running.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};
