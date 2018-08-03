import styled from 'styled-components'

export default styled.div`

  .dataTables_wrapper {
    display: initial;
  }

  .data-table {
    height: 100%;
    opacity: 1;
    visibility: visible;
    color: grey;

    &__loader {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    &--initializing {
      opacity: 0;
      visibility: hidden;
    }
    
    .dataTables_scrollBody {
      thead {
        border: none;
        .sorting,
        .sorting_asc,
        .sorting_desc {
          &:after {
            display: none;
          }
        }
      }
    }

    .sorting,
    .sorting_asc,
    .sorting_desc {
      cursor: pointer;
      &:after {
        position: absolute;
        margin-left: 0.3rem;
      }
    }
    .sorting:after {
      content: "↕";
      color: grey;
    }
    .sorting_asc:after {
      content: "↓";
      color: inherit;
    }
    .sorting_desc:after {
      content: "↑";
      color: inherit;
    }

    .dataTables_processing {
      position: absolute;
      width: 100%;
      height: 100%;

      &:before {
        content: "";
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        background-color: rgba(255, 255, 255, 0.6);
      }
    }

    .dataTables_filter {
      input[type="search"] {
        appearance: none;
        border-radius: 0;
        width: 100%;
        padding: 0 20px;
        height: 40px;
        background: $white;
        border: 1px solid grey;
        &:focus {
          outline: 0;
        }
        &::placeholder {
          color: grey;
          opacity: 0.9;
        }
      }
    }

    .dataTables_paginate {
      display: flex;
      flex-flow: row nowrap;
      justify-content: start;
      align-items: center;
      font-size: 1.2rem;
      text-align: start;

      .ellipsis {
        color: $grey-text;
      }
      .paginate_button {
        padding: 5px;
        color: $red;
        cursor: pointer;
        &:focus {
          outline: 0;
        }
        &:hover {
          color: inherit;
        }
        &.current {
          color: darkslategrey
          text-decoration: underline;
        }
      }

      .disabled {
        cursor: not-allowed;
      }

      .first,
      .previous,
      .next,
      .last {
        padding: 10px;
      }

      .previous {
        margin-right: 10px;
      }

      .next {
        margin-left: 10px;
      }
    }

    .dataTables_length{
      select {
        width: 70px;
        padding: 0 15px 0 15px;
        margin: 0 10px;
      }
    }
  }


`
