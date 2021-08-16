/**
 * This finder try to find the Authorizer Id for a given ApiGatewayName/AuthorizerName
 */
class ApiGatewayAuthorizerIdFinder {

  async find(name) {
    // Split the name on a period. The expected syntax for `name` is `<ApiGatewayName>.<AuthoerizerName>`
    if (!name.includes(".")) {
      console.error(`Expected the Api Gateway Authorizer Name to be of the form \`<ApiGatewayName>.<AuthorizerName>\`. Got \`${name}\``)
      return
    }
    const split = name.split(".")
    const apiGatewayName = split[0]
    const apiGatewayAuthorizerName = split[1]

    if (!this.apiGatewayIds) {
      const response = await this.provider.request(
        "APIGateway",
        "getRestApis",
        {
          limit: "600" // AWS have a hard service quota 600
        }
      )
      if (response) {
        this.apiGatewayIds = {}
        for (const gateway of response.items) {
          this.apiGatewayIds[gateway.name] = gateway.id
        }
      }
    }

    if (this.apiGatewayIds) {
      let apiGatewayId
      if (apiGatewayName && this.apiGatewayIds.hasOwnProperty(apiGatewayName)) {
        apiGatewayId = this.apiGatewayIds[apiGatewayName]
      } else {
        // If name is NOT given
        // Or given as .AuthorizerName(no apiGatewayName)
        // Or apiGatewayName does not find
        // Pick up the first apiGatewayId
        const keys = Object.keys(this.apiGatewayIds)
        apiGatewayId = this.apiGatewayIds[keys[0]]
      }
      const response = await this.provider.request(
        "APIGateway",
        "getAuthorizers",
        {
          restApiId: apiGatewayId,
          limit: "10" // By default, AWS quota is 10 for each API
        }
      )
      if (response) {
        this.apiGatewayAuthorizerIds = {}
        for (const authorizer of response.items) {
          this.apiGatewayAuthorizerIds[authorizer.name] = authorizer.id
        }
      }
      const authorizersKeys = Object.keys(this.apiGatewayAuthorizerIds)
      if (apiGatewayAuthorizerName && authorizersKeys.length > 0 && this.apiGatewayAuthorizerIds.hasOwnProperty(apiGatewayAuthorizerName)) {
        return this.apiGatewayAuthorizerIds[apiGatewayAuthorizerName]
      } else {
        return this.apiGatewayAuthorizerIds[authorizersKeys[0]]
      }
    } else {
      console.error("No API Gateways found in AWS")
      serverless.cli.log("No API Gateways found in AWS")
    }
  }
}

module.exports = ApiGatewayAuthorizerIdFinder
