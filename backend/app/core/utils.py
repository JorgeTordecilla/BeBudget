import re
from datetime import UTC, datetime
from typing import Protocol


class UTCClock(Protocol):
    def now(self) -> datetime: ...


class SystemUTCClock:
    def now(self) -> datetime:
        return datetime.now(tz=UTC)


UTC_CLOCK: UTCClock = SystemUTCClock()
_YYYY_MM_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def utcnow() -> datetime:
    return UTC_CLOCK.now()


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def previous_month_yyyy_mm(month: str) -> str:
    if not _YYYY_MM_RE.fullmatch(month):
        raise ValueError("month must be a valid YYYY-MM value")

    year = int(month[:4])
    month_num = int(month[5:7]) - 1
    if month_num == 0:
        year -= 1
        month_num = 12
    return f"{year:04d}-{month_num:02d}"
