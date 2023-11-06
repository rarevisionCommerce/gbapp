var cron = require("node-cron");
const Order = require("../models/Order");
const moment = require('moment');

// updating subscription to not paid if expired 
const updateSubscriptions = async () => {
 try {
  const subscriptionToUpdate = await Order.find({
   isPaid: true,
  }).exec();

  if (!subscriptionToUpdate.length) {
   console.log("No subscriptions found!");
   return;
  }
  let updatedSub = 0;
  for (const subscription of subscriptionToUpdate) {
   const expired = hasThirtyDaysPassed(subscription.paymentDate);
   if (expired) {
    subscription.isPaid = false;
    await subscription.save();
    updatedSub +=1;
    console.log(`Updated subscription with ID ${subscription._id}`);
   }
  }

  console.log("Finished updating subscriptions.", updatedSub, "updated");
 } catch (error) {
  console.error("An error occurred:", error);
 }
};

// the cron job should run 12:00 AM everyday = '0 0 * * *'

exports.innitScheduleJob = () => {
 const updateSubscriptionsTask = cron.schedule("0 0 * * *", () => {
  updateSubscriptions();
 });

 updateSubscriptionsTask.start();
};

// function to check if 30 days are over!
function hasThirtyDaysPassed(inputDate) {
 // Parse the input date string using moment
 const inputMoment = moment(inputDate);

 // Calculate the current moment
 const currentMoment = moment();

 // Calculate the difference in days
 const daysDifference = currentMoment.diff(inputMoment, 'days');

 // Check if 30 or more days have passed
 return daysDifference >= 30;
}
