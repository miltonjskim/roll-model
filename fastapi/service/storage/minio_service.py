# minioClient = Minio(
#     endpoint="minio:9000",
#     access_key="test",
#     secret_key="test",
#     secure=False,
# )

# class MinioService:
#     def __init__(self, bucket_name: str):
#         self.bucket_name = bucket_name
#         self.create_bucket()

#     def create_bucket(self):
#         if not minioClient.bucket_exists(self.bucket_name):
#             minioClient.make_bucket(self.bucket_name)

#     def upload_file(self, file_path: str, object_name: str):
#         minioClient.fput_object(self.bucket_name, object_name, file_path)

#     def download_file(self, object_name: str, file_path: str):
#         minioClient.fget_object(self.bucket_name, object_name, file_path)

#     def delete_file(self, object_name: str):
#         minioClient.remove_object(self.bucket_name, object_name)