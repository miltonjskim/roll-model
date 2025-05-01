from fastapi import APIRouter
from api.v1.project import views

api_router = APIRouter()
api_router.include_router(views.router, prefix="/projects/{project_id}", tags=["project"])