import Invoice from '../models/Invoice.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';

export const getLastInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne().sort({ _id: -1 });
    console.log(invoice);
    res.status(200).json({
      invoice,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching last invoice', 500));
  }
});

export const createInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const invoice = await Invoice.create(req.body);

    res.status(201).json({
      invoice,
    });
  } catch (error) {
    next(new ErrorHandler('Error creating invoice' + error, 500));
  }
});

export const getInvoices = catchAsyncError(async (req, res, next) => {
  try {
    const invoices = await Invoice.find().populate('customer');
    res.status(200).json({
      invoices,
    });
  } catch (error) {
    next(new ErrorHandler('Error fetching invoices', 500));
  }
});

export const getSingleInvoice = catchAsyncError(async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
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

    const invoices = await Invoice.find({ customer: customerId }).populate(
      'customer'
    );
    // const invoices = await Invoice.find().populate('customer');

    const customer = await Customer.findById(customerId);
    const customerName = customer.name;

    let total = 0;
    invoices.map((invoice) => {
      console.log(invoice.invoiceProducts);
      total += invoice.grandTotal;
    });

    res.status(200).json({
      invoices,
      total,
      customerName,
    });
  } catch (error) {
    console.log(error);
    next(new ErrorHandler('Error fetching invoices for the customer', 500));
  }
});

export const updateInvoice = catchAsyncError(async (req, res, next) => {
  try {
    let invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return next(new ErrorHandler('Invoice not found', 404));
    }

    invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.log(error);
    next(new ErrorHandler('Error updating invoice', 500));
  }
});

export const deleteInvoice = catchAsyncError(async (req, res, next) => {
  let product = await Invoice.findById(req.params.id);
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
      const customers = await Customer.find();

      const customerBillingInfo = await Promise.all(
        customers.map(async (customer) => {
          const invoices = await Invoice.find({ customer: customer._id });
          const payments = await Payment.find({ customer: customer._id });

          const totalBill = invoices.reduce(
            (acc, invoice) => acc + invoice.grandTotal,
            0
          );
          const totalPaid = payments.reduce(
            (acc, payment) => acc + payment.amountPaid,
            0
          );
          const remainingAmount = totalBill - totalPaid;

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
