const { User, Group, Expense } = require('../model/schema');
const bcrypt = require('bcryptjs');

const createDemoUser = async () => {
    try {
        const demoUserData = {
            firstName: "Demo",
            lastName: "User",
            emailId: "demo@splitapp.com",
            isDemo: true
        };

        const existingDemo = await User.findOne({ emailId: demoUserData.emailId });
        if (existingDemo) {
            return existingDemo;
        }

        // Hash the demo password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("demo123", salt);

        demoUserData.password = hashedPassword;

        const newDemoUser = new User(demoUserData);
        return await newDemoUser.save();
    } catch (error) {
        console.error('Error creating demo user:', error);
        throw error;
    }
};

const createDemoData = async () => {
    try {
        const demoUser = await createDemoUser();

        // Create demo groups if they don't exist
        const demoGroups = [
            {
                groupName: "Demo Trip to Goa",
                groupDescription: "Sample vacation expenses for demo",
                groupCurrency: "INR",
                groupOwner: demoUser.emailId,
                groupMembers: [demoUser.emailId, "alice@demo.com", "bob@demo.com"],
                groupCategory: "Trip",
                groupTotal: 15000,
                split: [
                    { user: demoUser.emailId, amount: 5000 },
                    { user: "alice@demo.com", amount: 5000 },
                    { user: "bob@demo.com", amount: 5000 }
                ]
            },
            {
                groupName: "Roommate Expenses",
                groupDescription: "Monthly shared house expenses",
                groupCurrency: "INR",
                groupOwner: demoUser.emailId,
                groupMembers: [demoUser.emailId, "roommate@demo.com"],
                groupCategory: "Home",
                groupTotal: 8000,
                split: [
                    { user: demoUser.emailId, amount: 4000 },
                    { user: "roommate@demo.com", amount: 4000 }
                ]
            },
            {
                groupName: "Office Lunch Group",
                groupDescription: "Daily office lunch expenses",
                groupCurrency: "INR",
                groupOwner: demoUser.emailId,
                groupMembers: [demoUser.emailId, "colleague1@demo.com", "colleague2@demo.com", "colleague3@demo.com"],
                groupCategory: "Food",
                groupTotal: 2400,
                split: [
                    { user: demoUser.emailId, amount: 600 },
                    { user: "colleague1@demo.com", amount: 600 },
                    { user: "colleague2@demo.com", amount: 600 },
                    { user: "colleague3@demo.com", amount: 600 }
                ]
            }
        ];

        // Save demo groups
        for (const groupData of demoGroups) {
            const existingGroup = await Group.findOne({
                groupName: groupData.groupName,
                groupOwner: demoUser.emailId
            });

            if (!existingGroup) {
                const group = new Group(groupData);
                const savedGroup = await group.save();

                // Create some demo expenses for this group
                await createDemoExpenses(savedGroup._id.toString(), groupData);
            }
        }

        return demoUser;
    } catch (error) {
        console.error('Error creating demo data:', error);
        throw error;
    }
};

const createDemoExpenses = async (groupId, groupData) => {
    try {
        const demoExpenses = [];

        if (groupData.groupName.includes("Trip")) {
            demoExpenses.push(
                {
                    groupId: groupId,
                    expenseName: "Hotel Booking",
                    expenseDescription: "3 nights hotel stay",
                    expenseAmount: 6000,
                    expenseCategory: "Accommodation",
                    expenseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                    expenseOwner: groupData.groupOwner,
                    expenseMembers: groupData.groupMembers,
                    expensePerMember: 2000
                },
                {
                    groupId: groupId,
                    expenseName: "Car Rental",
                    expenseDescription: "Rental car for 3 days",
                    expenseAmount: 4500,
                    expenseCategory: "Transportation",
                    expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                    expenseOwner: groupData.groupMembers[1],
                    expenseMembers: groupData.groupMembers,
                    expensePerMember: 1500
                },
                {
                    groupId: groupId,
                    expenseName: "Restaurant Dinner",
                    expenseDescription: "Beach side restaurant",
                    expenseAmount: 4500,
                    expenseCategory: "Food",
                    expenseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                    expenseOwner: groupData.groupMembers[2],
                    expenseMembers: groupData.groupMembers,
                    expensePerMember: 1500
                }
            );
        } else if (groupData.groupName.includes("Roommate")) {
            demoExpenses.push(
                {
                    groupId: groupId,
                    expenseName: "Electricity Bill",
                    expenseDescription: "Monthly electricity bill",
                    expenseAmount: 3000,
                    expenseCategory: "Utilities",
                    expenseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                    expenseOwner: groupData.groupOwner,
                    expenseMembers: groupData.groupMembers,
                    expensePerMember: 1500
                },
                {
                    groupId: groupId,
                    expenseName: "Grocery Shopping",
                    expenseDescription: "Monthly groceries",
                    expenseAmount: 5000,
                    expenseCategory: "Food",
                    expenseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                    expenseOwner: groupData.groupMembers[1],
                    expenseMembers: groupData.groupMembers,
                    expensePerMember: 2500
                }
            );
        } else if (groupData.groupName.includes("Lunch")) {
            demoExpenses.push(
                {
                    groupId: groupId,
                    expenseName: "Pizza Lunch",
                    expenseDescription: "Team lunch at pizza place",
                    expenseAmount: 1200,
                    expenseCategory: "Food",
                    expenseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    expenseOwner: groupData.groupOwner,
                    expenseMembers: groupData.groupMembers,
                    expensePerMember: 300
                },
                {
                    groupId: groupId,
                    expenseName: "Chinese Food",
                    expenseDescription: "Lunch from Chinese restaurant",
                    expenseAmount: 1200,
                    expenseCategory: "Food",
                    expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    expenseOwner: groupData.groupMembers[1],
                    expenseMembers: groupData.groupMembers,
                    expensePerMember: 300
                }
            );
        }

        // Save all demo expenses
        for (const expenseData of demoExpenses) {
            const expense = new Expense(expenseData);
            await expense.save();
        }

    } catch (error) {
        console.error('Error creating demo expenses:', error);
    }
};

module.exports = { createDemoUser, createDemoData };
