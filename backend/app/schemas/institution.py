from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class InstitutionBase(BaseModel):
    name: str
    aicte_id: str
    address: str
    state: str
    district: str
    pin_code: str
    contact_email: EmailStr
    contact_phone: str
    category: str = "ENGINEERING_AND_TECHNOLOGY"


class InstitutionCreate(InstitutionBase):
    pass


class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pin_code: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class InstitutionOut(InstitutionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    created_at: datetime
    updated_at: datetime
