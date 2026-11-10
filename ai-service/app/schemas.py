from pydantic import BaseModel
from typing import List

class RedesignRequest(BaseModel):
    designId: str
    imageUrl: str
    roomType: str
    style: str
    budgetRange: str = "medium"
    colors: List[str] = []
    numVariants: int = 1
    seed: int = 42