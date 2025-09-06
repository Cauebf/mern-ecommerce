import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

// get all dates between startDate and endDate in YYYY-MM-DD format
function getDatesInRange(startDate: Date, endDate: Date) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export const getAnalyticsData = async () => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // get total sales and total revenue from orders collection
    const salesData = await Order.aggregate([
      {
        $group: {
          _id: null, // it groups all documents together
          totalSales: { $sum: 1 }, // it sums all the order documents together and stores it in a field called totalSales
          totalRevenue: { $sum: "$totalAmount" }, // it sums all the totalAmount fields of the order documents together and stores it in a field called totalRevenue
        },
      },
    ]);

    const { totalSales, totalRevenue } = salesData[0] || {
      totalSales: 0,
      totalRevenue: 0,
    };

    return {
      users: totalUsers,
      products: totalProducts,
      totalSales,
      totalRevenue,
    };
  } catch (error) {
    throw error;
  }
};

export const getDailySalesData = async (startDate: Date, endDate: Date) => {
  try {
    const dailySalesData = await Order.aggregate([
      {
        // it matches all documents that have a createdAt field that is greater than or equal to the startDate and less than or equal to the endDate
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          // it groups the documents together based on the createdAt field
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // it converts the createdAt field to a string and formats it to YYYY-MM-DD
          sales: { $sum: 1 }, // it sums all the order documents together
          revenue: { $sum: "$totalAmount" }, // it sums all the totalAmount fields of the order documents together
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // example of dailySalesData:
    //   [
    //     {
    //       _id: "2025-09-05",
    //       sales: 12,
    //       revenue: 1450.75,
    //     },
    //     ...
    //   ];

    const dateArray = getDatesInRange(startDate, endDate);
    // console.log(dateArray) -> ["2025-09-05", "2025-09-06", ...];

    return dateArray.map((date) => {
      const foundData = dailySalesData.find((item) => item._id === date); // it finds the item in the dailySalesData array that has the same _id as the date

      return {
        date,
        sales: foundData ? foundData.sales : 0,
        revenue: foundData ? foundData.revenue : 0,
      };
    });
  } catch (error) {
    throw error;
  }
};
