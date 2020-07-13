// types for rendering the constructs
export type Product = {
    Name: string;
    ProvisioningArtifacts: ProvisioningArtifact[];
};

export type ProvisioningArtifact = {
    Name: string;
    Parameters: ProvisioningArtifactParameter[];
    Outputs: {
        OutputName: string;
        OutputDescription?: string;
    }[];
};

export type ProvisioningArtifactParameter = {
    ParameterName: string;
    ParameterType: string;
    ParameterRequired: boolean;
    ParameterDescription?: string;
};

export type Portfolio = {
    Products: Product[];
};

// Types for parsing CloudFormation templates
export type Template = {
    Parameters: { [key: string]: Parameter };
    Outputs: { [key: string]: Output };
};

export type Parameter = {
    Type: ParameterType;
    Description?: string;
    Default?: string;
};

export type ParameterType = string;

export type Output = {
    Description?: string;
};
