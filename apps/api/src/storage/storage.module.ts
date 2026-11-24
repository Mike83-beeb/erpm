import { Global, Module } from "@nestjs/common";
import { RustfsService } from "./rustfs.service.js";
import { StorageController } from "./storage.controller.js";
import { StorageService } from "./storage.service.js";

@Global()
@Module({
  controllers: [StorageController],
  providers: [RustfsService, StorageService],
  exports: [RustfsService, StorageService],
})
export class StorageModule {}
