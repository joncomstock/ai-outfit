import "@testing-library/jest-dom";

process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_placeholder";
process.env.CLERK_SECRET_KEY = "sk_test_placeholder";
process.env.CLERK_WEBHOOK_SECRET = "whsec_test_placeholder";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_test_token";
process.env.ANTHROPIC_API_KEY = "sk-ant-test-placeholder";
