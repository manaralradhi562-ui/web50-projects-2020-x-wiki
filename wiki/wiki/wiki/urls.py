from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),  # هذا السطر الأصلي الصحيح
    path('', include("encyclopedia.urls")),
]