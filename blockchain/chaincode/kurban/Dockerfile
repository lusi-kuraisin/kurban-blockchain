FROM hyperledger/fabric-nodeenv:2.5

WORKDIR /chaincode

COPY ./ /chaincode

RUN npm install --omit=dev --offline
