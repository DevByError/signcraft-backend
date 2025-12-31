import bcrypt from 'bcrypt';

const saltRounds = 10;

const encryptpass = (myPlaintextPassword: string): Promise<string> => {
    return bcrypt.hash(myPlaintextPassword, saltRounds);
};

export default encryptpass;