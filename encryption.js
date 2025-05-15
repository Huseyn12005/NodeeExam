import crypto from 'crypto';

const secretKey = crypto.scryptSync(process.env.SECRET || 'fallback_key', 'salt', 32);
const initializationVector = Buffer.alloc(16, 0);

export function encrypt(data) {
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, initializationVector);
    let encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    return encrypted;
}

export function decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, initializationVector);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');
    return decrypted;
}

export default { encrypt, decrypt };
