from pydantic import BaseModel, Field


class NotificationPreferencesResponse(BaseModel):
    email_notifications_enabled: bool
    weekly_summary_enabled: bool
    weekly_summary_day: int = Field(..., ge=0, le=6)
    weekly_summary_hour: int = Field(..., ge=0, le=23)
    notification_timezone: str = Field(..., min_length=1, max_length=64)


class NotificationPreferencesUpdate(BaseModel):
    email_notifications_enabled: bool | None = None
    weekly_summary_enabled: bool | None = None
    weekly_summary_day: int | None = Field(default=None, ge=0, le=6)
    weekly_summary_hour: int | None = Field(default=None, ge=0, le=23)
    notification_timezone: str | None = Field(default=None, min_length=1, max_length=64)


class NotificationTestResponse(BaseModel):
    status: str
    detail: str
