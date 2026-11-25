import { Global, Module } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service.js";
import { RustfsService } from "./rustfs.service.js";
import { StorageController } from "./storage.controller.js";
import { StorageService } from "./storage.service.js";

@Global()
@Module({
  controllers: [StorageController],
  providers: [RustfsService, StorageService, AttachmentsService],
  exports: [RustfsService, StorageService, AttachmentsService],
})
export class StorageModule {}
