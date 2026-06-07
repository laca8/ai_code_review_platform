import bcrypt from 'bcryptjs'

export class PasswordService {
    private static readonly SALT_ROUNDS = 10;

    static async hash(password: string): Promise<string> {

        return await bcrypt.hash(password, this.SALT_ROUNDS)
    }

    static async compare(password: string, userPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, userPassword)
    }
}