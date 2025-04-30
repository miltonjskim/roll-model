from fastapi import APIRouter
from api.v1.preprocessing import views

api_router = APIRouter()
api_router.include_router(views.router, prefix="/pipelines/{pipeline_id}/preprocessing", tags=["preprocessing"])