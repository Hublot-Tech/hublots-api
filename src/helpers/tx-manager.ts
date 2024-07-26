import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Connection, ClientSession } from "mongoose";
import { InjectConnection } from "@nestjs/mongoose";

@Injectable()
export class TransactionManager implements OnModuleDestroy {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async withTransaction<T>(
    callback: (session: ClientSession) => T | Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  onModuleDestroy() {
    // Cleanup logic if needed
  }
}
