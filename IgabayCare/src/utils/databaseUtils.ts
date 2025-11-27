import { supabase } from '../supabaseClient';

export class DatabaseUtils {
  /**
   * Check if a table exists in the database
   */
  static async tableExists(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error || !error.message.includes('does not exist');
    } catch (error) {
      return false;
    }
  }

  /**
   * Create the reviews table if it doesn't exist
   * Note: In production, this should be handled via migration scripts
   */
  static async createReviewsTableIfNotExists(): Promise<boolean> {
    try {
      const exists = await this.tableExists('reviews');
      if (exists) {
        return true;
      }

      // In a real application, you would typically use Supabase migrations
      // This is a workaround for development purposes
      console.warn('Reviews table does not exist. Please create it via Supabase dashboard or migrations.');
      
      // For now, just return false to indicate the table doesn't exist
      return false;
    } catch (error) {
      console.error('Error checking/creating reviews table:', error);
      return false;
    }
  }

  /**
   * Initialize database tables - call this during app startup
   */
  static async initializeTables(): Promise<void> {
    try {
      await this.createReviewsTableIfNotExists();
    } catch (error) {
      console.error('Error initializing database tables:', error);
    }
  }

  /**
   * Safely execute a query with error handling
   */
  static async safeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    fallbackValue: T,
    context: string
  ): Promise<T> {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        console.warn(`${context} query failed:`, error.message);
        return fallbackValue;
      }
      
      return data || fallbackValue;
    } catch (error) {
      console.warn(`${context} query exception:`, error);
      return fallbackValue;
    }
  }
}

export default DatabaseUtils;