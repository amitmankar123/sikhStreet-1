import React from "react";
import { useParams } from "react-router-dom";
import DynamicProductWizard from "./DynamicProductWizard";

const ProductForm = () => {
  const { id } = useParams();
  return <DynamicProductWizard isEdit={true} productId={id} />;
};

export default ProductForm;
