from fastapi import APIRouter
from api.v2.preprocessing import views

api_router = APIRouter()
api_router.include_router(views.router, prefix="/pipelines/{pipeline_id:str}/preprocessing", tags=["preprocessing"])