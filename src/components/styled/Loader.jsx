import styled from 'styled-components'


export default ({
  color
}) => styled.div`
  postion: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  &:before {
    content: "";
    position:absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(255, 255, 255, 0.6);
  }

  > * {
    color: ${color || 'black'}; 
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
`
