import { supabase } from '../src/supabase';
import { Role, UserProfile } from '../types';

// Helper functions for farm customer user creation
export const generateFarmEmail = (farmName: string): string => {
    const words = farmName.trim().split(/\s+/);
    if (words.length < 2) {
        // If only one word, use first 2 characters
        const firstWord = words[0].toLowerCase();
        return `${firstWord.substring(0, 2)}@bflos.com`;
    }
    
    const firstWord = words[0].toLowerCase();
    const secondWord = words[1].toLowerCase();
    const secondChar = secondWord.charAt(0);
    
    return `${firstWord}_${secondChar}@bflos.com`;
};

export const generateFarmPassword = (farmName: string): string => {
    const words = farmName.trim().split(/\s+/);
    if (words.length < 2) {
        // If only one word, use first 2 characters + 321
        const firstWord = words[0];
        return `${firstWord.charAt(0).toUpperCase()}${firstWord.charAt(1).toLowerCase()}321`;
    }
    
    const firstWord = words[0];
    const secondWord = words[1];
    const firstChar = firstWord.charAt(0).toUpperCase();
    const secondChar = secondWord.charAt(0).toLowerCase();
    
    return `${firstChar}${secondChar}321`;
};

export const createFarmCustomerUser = async (farmName: string) => {
    try {
        const email = generateFarmEmail(farmName);
        const password = generateFarmPassword(farmName);
        
        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('staff_table')
            .select('id')
            .eq('email', email)
            .single();
            
        if (existingUser) {
            console.log(`User with email ${email} already exists`);
            return { success: false, message: `User with email ${email} already exists` };
        }
        
        // Create staff record
        const { data: staffData, error: staffError } = await supabase
            .from('staff_table')
            .insert([{
                name: farmName,
                email: email,
                password: password,
                role: Role.Farmer,
            }])
            .select()
            .single();

        if (staffError) {
            console.error('Error creating farm customer user:', staffError);
            return { success: false, message: `Failed to create user: ${staffError.message}` };
        }

        // Return the created user
        const newUser: UserProfile = {
            id: staffData.id,
            name: staffData.name,
            email: staffData.email,
            role: staffData.role as Role,
        };
        
        return { 
            success: true, 
            message: `Farm customer user created successfully! Email: ${email}, Password: ${password}`,
            user: newUser,
            email: email,
            password: password
        };
    } catch (err) {
        console.error('Unexpected error creating farm customer user:', err);
        return { success: false, message: 'An unexpected error occurred while creating farm customer user' };
    }
};

// Example usage:
// For "Green Valley Farm" -> email: "green_v@bflos.com", password: "Gv321"
// For "Bounty 1" -> email: "bounty_1@bflos.com", password: "B1321"
