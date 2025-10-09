import Invoice from '../models/Invoice.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';

export const getLastInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ user: req.user.id }).sort({
      _id: -1,
    });

    // console.log(invoice);
    res.status(200).json({
      invoice,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching last invoice', 500));
  }
});

export const createInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const exist = await Invoice.findOne({
      user: req.user.id,
      invoiceNo: req.body.invoiceNo,
    });
    if (exist) {
      next(new ErrorHandler('Invoice Exists', 400));
    }
    const invoice = await Invoice.create({ ...req.body, user: req.user.id });

    res.status(201).json({
      invoice,
    });
  } catch (error) {
    next(new ErrorHandler('Error creating invoice' + error, 500));
  }
});

export const getInvoices = catchAsyncError(async (req, res, next) => {
  // console.log(req.user);
  try {
    const invoices = await Invoice.find({ user: req.user.id })
      .populate('customer')
      .sort({
        invoiceNo: -1,
      });
    // console.log(invoices);
    res.status(200).json({
      invoices,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching invoices', 500));
  }
});

export const getSingleInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    res.status(200).json({
      invoice,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching invoice', 500));
  }
});
// export const getInvoicesByCustomer = catchAsyncError(async (req, res, next) => {
//   try {
//     const customerId = req.params.id;
//     console.log(customerId);

//     // Validate if customerId is a valid ObjectId before querying the database
//     if (!mongoose.Types.ObjectId.isValid(customerId)) {
//       return next(new ErrorHandler('Invalid customer ID', 400));
//     }

//     const invoices = await Invoice.find({ customer: customerId });
//     // const invoices = await Invoice.find({ customer: customerId }).populate(
//     //   'customer',
//     //   'name'
//     // );
//     const customer = await Customer.findById(customerId);
//     const customerName = customer.name;
//     console.log(customerName);
//     let total = 0;
//     invoices.map((invoice) => {
//       total += invoice.grandTotal;
//     });
//     console.log(total);

//     res.status(200).json({
//       invoices,
//       total,
//       customerName,
//     });
//   } catch (error) {
//     console.log(error);
//     next(new ErrorHandler('Error fetching invoices for the customer', 500));
//   }
// });

export const getInvoicesByCustomer = catchAsyncError(async (req, res, next) => {
  try {
    const customerId = req.params.id;

    // Validate if customerId is a valid ObjectId before querying the database
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return next(new ErrorHandler('Invalid customer ID', 400));
    }

    // const invoices = await Invoice.find().populate('customer');

    const invoices = await Invoice.find({
      customer: customerId,
      user: req.user.id,
    }).populate('customer');
    // const invoices = await Invoice.find().populate('customer');

    const customer = await Customer.findById(customerId);
    const customerName = customer.name;

    let total = 0;
    invoices.map((invoice) => {
      // console.log(invoice.invoiceProducts);
      total += invoice.grandTotal;
    });

    res.status(200).json({
      invoices,
      total,
      customerName,
    });
  } catch (error) {
    // console.log(error);
    next(new ErrorHandler('Error fetching invoices for the customer', 500));
  }
});

export const updateInvoice = catchAsyncError(async (req, res, next) => {
  try {
    let invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!invoice) {
      return next(new ErrorHandler('Invoice not found', 404));
    }

    invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, user: req.user.id },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    // console.log(error);
    next(new ErrorHandler('Error updating invoice', 500));
  }
});

export const deleteInvoice = catchAsyncError(async (req, res, next) => {
  let product = await Invoice.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }
  await product.remove();
  res.status(200).json({
    success: true,
    message: 'Invoice Deleted',
  });
});

export const getCustomerBillingInfo = catchAsyncError(
  async (req, res, next) => {
    try {
      const customers = await Customer.find({ user: req.user.id });

      const customerBillingInfo = await Promise.all(
        customers.map(async (customer) => {
          const invoices = await Invoice.find({
            customer: customer._id,
            user: req.user.id,
          });
          const payments = await Payment.find({
            customer: customer._id,
            user: req.user.id,
          });

          const totalBill = invoices.reduce(
            (acc, invoice) => acc + invoice.grandTotal,
            0
          );
          const totalPaid = payments.reduce(
            (acc, payment) => acc + payment.amountPaid,
            0
          );
          const remainingAmount =
            (customer.openingBalance || 0) + totalBill - totalPaid;

          return {
            customerName: customer.name,
            totalBill,
            totalPaid,
            remainingAmount,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: customerBillingInfo,
      });
    } catch (error) {
      next(new ErrorHandler('Error fetching customer billing info', 500));
    }
  }
);

// export const getStatementByCustomer = catchAsyncError(
//   async (req, res, next) => {
//     const customerId = req.params.id;
//     try {
//       const customer = await Customer.findOne({
//         _id: customerId,
//         user: req.user.id,
//       });
//       if (!customer) {
//         return res.status(404).json({ error: 'Customer not found' });
//       }

//       const invoices = await Invoice.find({
//         user: req.user.id,
//         customer: customerId,
//       }).sort({
//         date: 1,
//       });
//       const payments = await Payment.find({
//         user: req.user.id,
//         customer: customerId,
//       }).sort({
//         date: 1,
//       });

//       const statement = [];
//       let totalPaid = 0;
//       let totalInvoice = 0;

//       // Add invoices to the statement
//       invoices.forEach((invoice) => {
//         totalInvoice += invoice.grandTotal;
//         statement.push({
//           date: invoice.date,
//           type: 'invoice',
//           detail: invoice.invoiceNo,
//           invoiceAmount: invoice.grandTotal,
//           paymentAmount: null,
//           balance: null, // We'll calculate balance later
//         });
//       });

//       // Add payments to the statement
//       payments.forEach((payment) => {
//         totalPaid += payment.amountPaid;
//         statement.push({
//           date: payment.date,
//           type: 'payment',
//           detail: 'Payment',
//           invoiceAmount: null,
//           paymentAmount: payment.amountPaid,
//           balance: null, // We'll calculate balance later
//         });
//       });

//       // Sort statement by date
//       statement.sort((a, b) => new Date(a.date) - new Date(b.date));

//       // Calculate balance
//       let currentBalance = 0;

//       statement.forEach((entry) => {
//         if (entry.type === 'invoice') {
//           currentBalance += entry.invoiceAmount; // Deduct invoice amount from balance
//           entry.balance = currentBalance; // Assign updated balance
//         } else if (entry.type === 'payment') {
//           currentBalance -= entry.paymentAmount; // Add payment amount to balance
//           entry.balance = currentBalance; // Assign updated balance
//         }
//       });

//       return res.json({
//         customerName: customer.name,
//         gstNo: customer.gstNo,
//         statement,
//         totalPaid,
//         totalInvoice,
//       });
//     } catch (error) {
//       next(new ErrorHandler('Error fetching customer billing info', 500));
//     }
//   }
// );

export const getStatementByCustomer = catchAsyncError(
  async (req, res, next) => {
    const customerId = req.params.id;
    try {
      const customer = await Customer.findOne({
        _id: customerId,
        user: req.user.id,
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const invoices = await Invoice.find({
        user: req.user.id,
        customer: customerId,
      }).sort({ date: 1 });

      const payments = await Payment.find({
        user: req.user.id,
        customer: customerId,
      }).sort({ date: 1 });

      const statement = [];
      let totalPaid = 0;
      let totalInvoice = 0;

      let currentBalance = 0;

      // ✅ Add Opening Balance if available (NO ADDITION to totalInvoice)
      if (customer.openingBalance && customer.openingBalance !== 0) {
        currentBalance = customer.openingBalance;
        statement.push({
          date: customer.createdAt || new Date('2024-01-01'),
          type: 'opening',
          detail: 'Opening Balance',
          invoiceAmount: customer.openingBalance,
          paymentAmount: null,
          balance: currentBalance,
        });
      }

      // ✅ Collect all invoices and payments into one list
      const entries = [
        ...invoices.map((inv) => ({
          date: inv.date,
          type: 'invoice',
          detail: inv.invoiceNo,
          invoiceAmount: inv.grandTotal,
          paymentAmount: null,
        })),
        ...payments.map((pay) => ({
          date: pay.date,
          type: 'payment',
          detail: 'Payment',
          invoiceAmount: null,
          paymentAmount: pay.amountPaid,
        })),
      ];

      // ✅ Sort by date
      entries.sort((a, b) => new Date(a.date) - new Date(b.date));

      // ✅ Process entries
      entries.forEach((entry) => {
        if (entry.type === 'invoice') {
          totalInvoice += entry.invoiceAmount;
          currentBalance += entry.invoiceAmount;
        } else if (entry.type === 'payment') {
          totalPaid += entry.paymentAmount;
          currentBalance -= entry.paymentAmount;
        }

        statement.push({
          ...entry,
          balance: Math.round(currentBalance * 100) / 100, // ✅ Round to 2 decimals
        });
      });

      return res.json({
        customerName: customer.name,
        gstNo: customer.gstNo,
        openingBalance: customer.openingBalance || 0,
        totalInvoice,
        totalPaid,
        remainingAmount: currentBalance,
        statement,
      });
    } catch (error) {
      next(new ErrorHandler('Error fetching customer billing info', 500));
    }
  }
);
