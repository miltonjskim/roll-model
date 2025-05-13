from fastapi import APIRouter
from api.v2.project import views

api_router = APIRouter()
api_router.include_router(views.router, prefix="/projects/{project_id}", tags=["project"])
api_router.include_router(views.pipeline_router, prefix="/pipelines/{pipeline_id}", tags=["pipeline"])
api_router.include_router(views.sample_router, prefix="", tags=["sample"])