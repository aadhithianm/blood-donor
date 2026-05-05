import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Import Models
import User from './modules/auth/auth.model.js';
import DonorProfile from './modules/donor/donor.model.js';
import HospitalProfile from './modules/hospital/hospital.model.js';
import { BloodRequest, DonorAssignment } from './modules/request/request.model.js';

// Random Data Generators
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const requestStatuses = ['pending', 'accepted', 'completed', 'expired', 'cancelled'];
const urgencies = ['normal', 'urgent', 'critical'];

const tamilNaduLocations = [
    { district: 'Chennai', towns: ['Adyar', 'Velachery', 'T Nagar', 'Anna Nagar', 'Mylapore', 'Tambaram'], coords: [80.2707, 13.0827] },
    { district: 'Coimbatore', towns: ['Peelamedu', 'RS Puram', 'Gandhipuram', 'Singanallur', 'Saravanampatti'], coords: [76.9558, 11.0168] },
    { district: 'Madurai', towns: ['Anna Nagar', 'KK Nagar', 'Palanganatham', 'Tallakulam'], coords: [78.1198, 9.9252] },
    { district: 'Trichy', towns: ['Thillai Nagar', 'Srirangam', 'Cantonment', 'K K Nagar'], coords: [78.7047, 10.7905] },
    { district: 'Salem', towns: ['Fairlands', 'Hastampatti', 'Leigh Bazaar', 'Ammapet'], coords: [78.1460, 11.6643] },
    { district: 'Tirunelveli', towns: ['Palayamkottai', 'Vannarpettai', 'Town', 'Thachanallur'], coords: [77.7132, 8.7139] },
    { district: 'Erode', towns: ['Thindal', 'Perundurai', 'Bhavani', 'Gobichettipalayam'], coords: [77.7172, 11.3410] },
    { district: 'Vellore', towns: ['Katpadi', 'Sathuvachari', 'Bagayam', 'Ranipet'], coords: [79.1325, 12.9165] },
];

const getRandomLocation = () => {
    const loc = tamilNaduLocations[Math.floor(Math.random() * tamilNaduLocations.length)];
    const town = loc.towns[Math.floor(Math.random() * loc.towns.length)];
    // Add tiny random offset to coordinates for unique markers
    const lat = loc.coords[1] + (Math.random() - 0.5) * 0.05;
    const lng = loc.coords[0] + (Math.random() - 0.5) * 0.05;

    return {
        type: 'Point',
        coordinates: [lng, lat],
        country: 'India',
        state: 'Tamil Nadu',
        district: loc.district,
        town: town,
        formattedAddress: `${town}, ${loc.district}, Tamil Nadu, India`,
    };
};

const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generatePassword = async (pwd) => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(pwd, salt);
};

async function seedDB() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await DonorProfile.deleteMany({});
        await HospitalProfile.deleteMany({});
        await BloodRequest.deleteMany({});
        await DonorAssignment.deleteMany({});
        console.log('✅ Database cleared');

        console.log('👤 Creating predefined users...');
        const adminHash = await generatePassword('A1d3g2s7@Blood');
        const donorHash = await generatePassword('Donor@123');
        const reqHash = await generatePassword('Requester@123');
        const hospHash = await generatePassword('Hospital@123');

        // Note: setting `passwordHash` because schema was updated to handle both, but explicitly setting it correctly is safer
        const preUsers = await User.insertMany([
            { name: 'Admin User', email: 'adbloodproject@gmail.com', passwordHash: adminHash, role: 'admin', isVerified: true, isEmailVerified: true },
            { name: 'Donor User', email: 'Donor01@adblood.com', passwordHash: donorHash, role: 'donor', location: getRandomLocation(), isVerified: true, isEmailVerified: true },
            { name: 'Requester User', email: 'Requester01@adblood.com', passwordHash: reqHash, role: 'requester', location: getRandomLocation(), isVerified: true, isEmailVerified: true },
            { name: 'Hospital Admin', email: 'Hospital01@adblood.com', passwordHash: hospHash, role: 'hospital', location: getRandomLocation(), isVerified: true, isEmailVerified: true },
        ]);

        const mainDonor = preUsers[1];
        const mainHospital = preUsers[3];

        await DonorProfile.create({
            userId: mainDonor._id,
            bloodGroup: 'O+',
            medCertUrl: 'https://placeholder.com/cert.pdf',
            availability: 'available',
            totalDonations: 5,
            verificationStatus: 'approved'
        });

        await HospitalProfile.create({
            userId: mainHospital._id,
            hospitalName: 'Main City Hospital',
            licenseUrl: 'https://placeholder.com/license.pdf',
            verificationStatus: 'approved',
            inventory: bloodGroups.map(bg => ({ bloodGroup: bg, units: Math.floor(Math.random() * 20) }))
        });

        console.log('👥 Generating 500 Donors...');
        const donorsArray = [];
        const donorProfilesArray = [];

        for (let i = 0; i < 500; i++) {
            const userId = new mongoose.Types.ObjectId();
            donorsArray.push({
                _id: userId,
                name: `TN Donor ${i + 1}`,
                email: `donor${i + 1}@adblood.com`,
                passwordHash: donorHash,
                role: 'donor',
                location: getRandomLocation(),
                isVerified: true,
                isEmailVerified: true,
                trustScore: Math.floor(Math.random() * 50) + 50
            });
            donorProfilesArray.push({
                userId: userId,
                bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
                medCertUrl: 'https://placeholder.com/cert.pdf',
                availability: Math.random() > 0.2 ? 'available' : 'on-cooldown',
                totalDonations: Math.floor(Math.random() * 10),
                verificationStatus: 'approved'
            });
        }
        await User.insertMany(donorsArray);
        await DonorProfile.insertMany(donorProfilesArray);

        console.log('🏥 Generating 200 Hospitals...');
        const hospitalsArray = [];
        const hospitalProfilesArray = [];

        for (let i = 0; i < 200; i++) {
            const userId = new mongoose.Types.ObjectId();
            hospitalsArray.push({
                _id: userId,
                name: `TN Hospital ${i + 1}`,
                email: `hospital${i + 1}@adblood.com`,
                passwordHash: hospHash,
                role: 'hospital',
                location: getRandomLocation(),
                isVerified: true,
                isEmailVerified: true
            });
            hospitalProfilesArray.push({
                userId: userId,
                hospitalName: `TN Hospital ${i + 1}`,
                licenseUrl: 'https://placeholder.com/license.pdf',
                verificationStatus: 'approved',
                inventory: bloodGroups.map(bg => ({ bloodGroup: bg, units: Math.floor(Math.random() * 50) }))
            });
        }
        await User.insertMany(hospitalsArray);
        await HospitalProfile.insertMany(hospitalProfilesArray);

        console.log('🩸 Generating 1000 Blood Requests...');
        const requestsArray = [];
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 6); // Last 6 months

        for (let i = 0; i < 1000; i++) {
            const loc = getRandomLocation();
            const createdAt = randomDate(pastDate, new Date());
            const type = Math.random() > 0.8 ? 'hospital' : 'individual';
            const status = requestStatuses[Math.floor(Math.random() * requestStatuses.length)];
            const unitsNeeded = Math.floor(Math.random() * 5) + 1;

            requestsArray.push({
                requesterId: preUsers[2]._id, // Assigning to Requester01 for simplicity, or we could randomize
                patientName: `Patient ${i + 1}`,
                bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
                unitsNeeded: unitsNeeded,
                unitsFulfilled: status === 'completed' ? unitsNeeded : Math.floor(Math.random() * unitsNeeded),
                urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
                requesterType: type,
                location: loc, // Embedded location
                status: status,
                expiresAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after creation
                createdAt: createdAt,
                updatedAt: createdAt
            });
        }
        await BloodRequest.insertMany(requestsArray);

        console.log('✅ Seeding Complete! Enjoy your data!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
}

seedDB();
