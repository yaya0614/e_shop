import { generateOpenAPIDocument } from '../utils/openapi';

export default defineEventHandler(() => {
  return generateOpenAPIDocument();
});
