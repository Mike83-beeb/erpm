import { Module } from "@nestjs/common";
import { AvailabilityService } from "./availability.service.js";
import { AvailabilityCalendarController } from "./calendar.controller.js";
import { CalendarFeedService } from "./calendar-feed.service.js";
import { DepartmentsController } from "./departments.controller.js";
import { DepartmentsService } from "./departments.service.js";
import { ScheduleLeaveService } from "./schedule-leave.service.js";
import {
  HolidaysController,
  SchedulesController,
  TimeOffController,
} from "./schedules-leave.controller.js";
import { StaffController } from "./staff.controller.js";
import { StaffService } from "./staff.service.js";
import { TeamsController } from "./teams.controller.js";
import { TeamsService } from "./teams.service.js";

@Module({
  controllers: [
    DepartmentsController,
    StaffController,
    TeamsController,
    SchedulesController,
    HolidaysController,
    TimeOffController,
    AvailabilityCalendarController,
  ],
  providers: [
    DepartmentsService,
    StaffService,
    TeamsService,
    ScheduleLeaveService,
    AvailabilityService,
    CalendarFeedService,
  ],
  exports: [
    DepartmentsService,
    StaffService,
    TeamsService,
    ScheduleLeaveService,
    AvailabilityService,
    CalendarFeedService,
  ],
})
export class StaffModule {}
