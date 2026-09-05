require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const mongoose = require("mongoose");
const Masjid = require("../models/Masjid");
const User = require("../models/User");

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        // =====================================================
        // 1. Find or create Masjid As Salam
        // =====================================================

        let masjid = await Masjid.findOne({
            name: "Masjid As Salam"
        });

        if (!masjid) {
            masjid = await Masjid.create({
                name: "Masjid As Salam",
                address: "",
                phone: "",
                email: "",
                isActive: true
            });

            console.log(
                "Masjid As Salam created:",
                masjid._id.toString()
            );
        } else {
            console.log(
                "Masjid As Salam already exists:",
                masjid._id.toString()
            );
        }

        const masjidId = masjid._id;

        console.log(
            "Using Masjid ID:",
            masjidId.toString()
        );


        // =====================================================
        // 2. Update old Users
        // =====================================================

        const usersResult = await User.updateMany(
            {
                role: { $ne: "superadmin" },
                $or: [
                    { masjidId: { $exists: false } },
                    { masjidId: null }
                ]
            },
            {
                $set: {
                    masjidId
                }
            }
        );

        console.log(
            "Users updated:",
            usersResult.modifiedCount
        );


        // =====================================================
        // 3. Update old Donations
        // =====================================================

        const donationsCollection =
            mongoose.connection.db.collection("donations");

        const donationsResult =
            await donationsCollection.updateMany(
                {
                    $or: [
                        { masjidId: { $exists: false } },
                        { masjidId: null }
                    ]
                },
                {
                    $set: {
                        masjidId
                    }
                }
            );

        console.log(
            "Donations updated:",
            donationsResult.modifiedCount
        );


        // =====================================================
        // 4. Update old Expenses
        // =====================================================

        const expensesCollection =
            mongoose.connection.db.collection("expenses");

        const expensesResult =
            await expensesCollection.updateMany(
                {
                    $or: [
                        { masjidId: { $exists: false } },
                        { masjidId: null }
                    ]
                },
                {
                    $set: {
                        masjidId
                    }
                }
            );

        console.log(
            "Expenses updated:",
            expensesResult.modifiedCount
        );


        // =====================================================
        // 5. Update old Students
        // =====================================================

        const studentsCollection =
            mongoose.connection.db.collection("students");

        const studentsResult =
            await studentsCollection.updateMany(
                {
                    $or: [
                        { masjidId: { $exists: false } },
                        { masjidId: null }
                    ]
                },
                {
                    $set: {
                        masjidId
                    }
                }
            );

        console.log(
            "Students updated:",
            studentsResult.modifiedCount
        );


        // =====================================================
        // 6. Update old Staff
        // =====================================================

        const staffCollection =
            mongoose.connection.db.collection("staff");

        const staffResult =
            await staffCollection.updateMany(
                {
                    $or: [
                        { masjidId: { $exists: false } },
                        { masjidId: null }
                    ]
                },
                {
                    $set: {
                        masjidId
                    }
                }
            );

        console.log(
            "Staff updated:",
            staffResult.modifiedCount
        );


        // =====================================================
        // 7. Update old Fee Payments
        // =====================================================

        const feePaymentsCollection =
            mongoose.connection.db.collection("feepayments");

        const feePaymentsResult =
            await feePaymentsCollection.updateMany(
                {
                    $or: [
                        { masjidId: { $exists: false } },
                        { masjidId: null }
                    ]
                },
                {
                    $set: {
                        masjidId
                    }
                }
            );

        console.log(
            "Fee payments updated:",
            feePaymentsResult.modifiedCount
        );


        // =====================================================
        // 8. Update old Events
        // =====================================================

        const eventsCollection =
            mongoose.connection.db.collection("events");

        const eventsResult =
            await eventsCollection.updateMany(
                {
                    $or: [
                        { masjidId: { $exists: false } },
                        { masjidId: null }
                    ]
                },
                {
                    $set: {
                        masjidId
                    }
                }
            );

        console.log(
            "Events updated:",
            eventsResult.modifiedCount
        );


        // =====================================================
        // 9. Update old Rentals
        // =====================================================

        const rentalsCollection =
            mongoose.connection.db.collection("rentals");

        const rentalsResult =
            await rentalsCollection.updateMany(
                {
                    $or: [
                        { masjidId: { $exists: false } },
                        { masjidId: null }
                    ]
                },
                {
                    $set: {
                        masjidId
                    }
                }
            );

        console.log(
            "Rentals updated:",
            rentalsResult.modifiedCount
        );


        // =====================================================
        // 10. Update old Prayer Times
        // =====================================================

        const prayerTimesCollection =
            mongoose.connection.db.collection("prayertimes");

        const prayerTimesResult =
            await prayerTimesCollection.updateMany(
                {
                    $or: [
                        { masjidId: { $exists: false } },
                        { masjidId: null }
                    ]
                },
                {
                    $set: {
                        masjidId
                    }
                }
            );

        console.log(
            "Prayer times updated:",
            prayerTimesResult.modifiedCount
        );


        // =====================================================
        // 11. Update old Settings
        // =====================================================

        const settingsCollection =
            mongoose.connection.db.collection("settings");

        const settingsResult =
            await settingsCollection.updateMany(
                {
                    $or: [
                        { masjidId: { $exists: false } },
                        { masjidId: null }
                    ]
                },
                {
                    $set: {
                        masjidId
                    }
                }
            );

        console.log(
            "Settings updated:",
            settingsResult.modifiedCount
        );


        // =====================================================
        // 12. Update old Donations / etc. only where missing
        // =====================================================
        //
        // This migration is SAFE to run again.
        // Already migrated records will not be changed.
        //


        console.log("");
        console.log("====================================");
        console.log("MIGRATION COMPLETED SUCCESSFULLY");
        console.log("====================================");
        console.log(
            "Masjid As Salam ID:",
            masjidId.toString()
        );


        await mongoose.disconnect();

        process.exit(0);

    } catch (error) {

        console.error(
            "Migration failed:",
            error
        );

        await mongoose.disconnect();

        process.exit(1);
    }
};

migrate();