import os
import httpx
from supabase import create_client
from supabase.lib.client_options import SyncClientOptions
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

httpx_client = httpx.Client(http2=False, timeout=120.0)

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
    options=SyncClientOptions(httpx_client=httpx_client),
)